import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { Report, ReportReason, ReportStatus } from '@repo/types';
import { CreateReportDto } from './dto/create-report-dto';
import sendReportConfirmation from '../../mails/send-report-confirmation';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: DatabaseService) {}

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

    const newReport = await this.prisma.report.create({
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

    const response: Report = {
      id: newReport.id,
      reason: newReport.reason as ReportReason,
      status: newReport.status as ReportStatus,
      userId: newReport.userId,
      blogId: newReport.blogId,
      createdAt: newReport.createdAt,
      updatedAt: newReport.updatedAt,
    };

    return response;
  }
}
