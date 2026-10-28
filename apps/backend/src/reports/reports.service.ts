import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { Report, ReportReason, ReportStatus } from '@repo/types';
import { CreateReportDto } from './dto/create-report-dto';
import sendReportConfirmation from '../../mails/send-report-confirmation';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private logger = new Logger(ReportsService.name);

  async createReport(
    createReportDto: CreateReportDto,
    blogSlug: string,
    userId: string,
  ): Promise<Report> {
    // A draft answers 404: only its author can see it, and they cannot report it.
    const blog = await this.prisma.blog.findUnique({
      where: {
        slug: blogSlug,
        isPublished: true,
      },
      select: {
        id: true,
        authorId: true,
      },
    });
    if (!blog) {
      throw new NotFoundException(`Blog with slug ${blogSlug} does not exist.`);
    }

    if (blog.authorId === userId) {
      throw new BadRequestException(`You cannot report your own blog.`);
    }

    // Check if the user has already reported this blog
    const existingReport = await this.prisma.report.findFirst({
      where: {
        blogId: blog.id,
        userId,
      },
    });

    if (existingReport) {
      throw new BadRequestException(
        `You have already reported this blog. You cannot report the same blog multiple times.`,
      );
    }

    const { reason } = createReportDto;

    this.logger.log(
      `Creating report for blog: ${blogSlug} by user: ${userId} with reason (${reason})`,
    );

    // A report withdraws the reporter's like, which endorses what they just flagged. One transaction,
    // so `likesCount` cannot drift from the rows; `deleteMany` avoids a find-then-delete race.
    const { newReport, removedLikes } = await this.prisma.$transaction(
      async (tx) => {
        const report = await tx.report.create({
          data: {
            reason,
            blogId: blog.id,
            userId,
          },
          include: {
            blog: {
              select: {
                title: true,
              },
            },
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        });

        const { count } = await tx.like.deleteMany({
          where: { userId, blogId: blog.id },
        });

        if (count > 0) {
          await tx.blog.update({
            where: { id: blog.id },
            data: { likesCount: { decrement: count } },
          });
        }

        return { newReport: report, removedLikes: count };
      },
    );

    // Fire and forget: the report is already stored, so awaiting the mail only
    // delays the response. The `catch` is required — an unhandled rejection
    // here would take the process down.
    void sendReportConfirmation({
      createdAt: newReport.createdAt,
      reporterEmail: newReport.user.email,
      reporterName: newReport.user.name,
      referenceId: newReport.id,
      blogTitle: newReport.blog.title,
    }).catch((error: unknown) =>
      this.logger.warn(
        `Failed to send the confirmation for report ${newReport.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );

    await this.notificationsService.createReportNotificationForAdmins(
      newReport.userId,
      newReport.blogId,
      newReport.id,
    );

    // Same as `unlikeBlog`: the author is not left with a notification for a like that is gone.
    if (removedLikes > 0) {
      await this.notificationsService.deleteLikeNotification(
        userId,
        blog.authorId,
        blog.id,
      );
    }

    const response: Report = {
      id: newReport.id,
      reason: newReport.reason as ReportReason,
      status: newReport.status as ReportStatus,
      // A new report is pending, and only a resolved one carries an action.
      action: null,
      userId: newReport.userId,
      blogId: newReport.blogId,
      createdAt: newReport.createdAt,
      updatedAt: newReport.updatedAt,
    };

    return response;
  }
}
