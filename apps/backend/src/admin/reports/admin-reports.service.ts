import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateReportStatusDto } from './dto/update-report-dto';
// Types only: a value import from `@repo/types` makes Node load its `.ts` source at runtime and crash.
import type {
  GetAllReportsWithFilters,
  Report,
  UpdateReportStatusResponse,
} from '@repo/types';
import { DEFAULT_ADMIN_TABLE_PAGE_SIZE } from '@repo/constants';
import { DatabaseService } from '../../database/database.service';
import { S3ServiceService } from '../../s3-service/s3-service.service';
import { Prisma } from '../../generated/prisma/client';
import { ModerationAction, ReportStatus } from '../../generated/prisma/enums';
import { ReportQueryDto } from './dto/report-query-dto';
import { auth } from '../../../lib/auth';
import { formatReportReasons } from '../../../lib/utils';
import sendBanNotification from '../../../mails/send-ban-notification';
import sendWarningNotification from '../../../mails/send-warning-notification';

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
  ) {}

  private logger = new Logger(AdminReportsService.name);

  async getAllReportsAsAdmin(
    query: ReportQueryDto,
  ): Promise<GetAllReportsWithFilters> {
    const { reporterName, reason, status, page, limit } = query;

    // Build the filter system based on the provided query parameters
    const reporterNameFilter: Prisma.ReportWhereInput = reporterName
      ? {
          user: {
            name: {
              contains: reporterName,
              mode: 'insensitive',
            },
          },
        }
      : {};

    const reasonFilter: Prisma.ReportWhereInput = reason
      ? {
          reason,
        }
      : {};

    const statusFilter: Prisma.ReportWhereInput = status
      ? {
          status,
        }
      : {};

    const filter: Prisma.ReportWhereInput = {
      ...reporterNameFilter,
      ...reasonFilter,
      ...statusFilter,
    };

    const limitValue = limit ?? DEFAULT_ADMIN_TABLE_PAGE_SIZE;
    const pageValue = page ?? 1;
    const skip = (pageValue - 1) * limitValue;

    const reports = await this.prisma.report.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        blog: {
          select: {
            id: true,
            title: true,
            slug: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitValue,
    });

    this.logger.log(`Retrieved ${reports.length} reports`);

    const totalReports = await this.prisma.report.count({ where: filter });
    const totalPages = Math.ceil(totalReports / limitValue);

    // Both avatars are stored as S3 keys, so each is signed before it reaches the table.
    const signedReports = await Promise.all(
      reports.map(async (report) => {
        const [reporterImage, authorImage] = await Promise.all([
          report.user.image && this.s3Service.getSignedUrl(report.user.image),
          report.blog.author.image &&
            this.s3Service.getSignedUrl(report.blog.author.image),
        ]);

        return {
          ...report,
          reason: report.reason as Report['reason'],
          status: report.status as Report['status'],
          action: report.action as Report['action'],
          user: { ...report.user, image: reporterImage },
          blog: {
            ...report.blog,
            author: { ...report.blog.author, image: authorImage },
          },
        };
      }),
    );

    return {
      reports: signedReports,
      totalPages,
    };
  }

  async updateReportStatusAsAdmin(
    reportId: string,
    updateReportDto: UpdateReportStatusDto,
    req: Request,
  ): Promise<UpdateReportStatusResponse> {
    const { status, action } = updateReportDto;

    const resolvedStatus = status === ReportStatus.RESOLVED;

    const existingReport = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        blog: {
          select: {
            title: true,
            author: {
              select: {
                id: true,
                role: true,
                email: true,
                name: true,
                banned: true,
                banExpires: true,
              },
            },
          },
        },
      },
    });
    if (!existingReport) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    // Prevent updating the report if the status is not PENDING
    if (existingReport.status !== ReportStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update report with status ${existingReport.status}. Only reports with status of pending can be updated.`,
      );
    }

    // Admins can't write anymore, so this only guards stories from before that rule.
    if (existingReport.blog.author.role === 'admin') {
      throw new BadRequestException(
        'Cannot perform moderation actions on admin users.',
      );
    }

    // Should not ban or warn users if the report is rejected
    if (status === ReportStatus.REJECTED && action) {
      throw new BadRequestException(
        'Cannot perform moderation actions on rejected reports.',
      );
    }

    const { blogId } = existingReport;

    // Resolving decides the whole story, so its other pending reports close with it and the author is acted on once.
    const { updatedReport, reasons } = await this.prisma.$transaction(
      async (tx) => {
        // Claimed only while still pending, so a double submit or a second admin can't act twice.
        const claimed = await tx.report.updateMany({
          where: { id: reportId, status: ReportStatus.PENDING },
          // The action is stored so a blog taken down with a ban can't be republished.
          data: { status, action },
        });
        if (claimed.count === 0) {
          throw new ConflictException('This report has already been reviewed.');
        }

        // A rejection answers this report only; others on the story may cite a different reason.
        if (!resolvedStatus) {
          return {
            updatedReport: await tx.report.findUniqueOrThrow({
              where: { id: reportId },
            }),
            reasons: '',
          };
        }

        const otherReports = await tx.report.findMany({
          where: { blogId, status: ReportStatus.PENDING },
          select: { id: true, reason: true },
        });
        await tx.report.updateMany({
          where: { id: { in: otherReports.map(({ id }) => id) } },
          data: { status: ReportStatus.RESOLVED },
        });
        await tx.blog.update({
          where: { id: blogId },
          data: { isPublished: false },
        });

        return {
          updatedReport: await tx.report.findUniqueOrThrow({
            where: { id: reportId },
          }),
          reasons: formatReportReasons([
            existingReport.reason,
            ...otherReports.map(({ reason }) => reason),
          ]),
        };
      },
    );

    // Runs after the commit, so a failed review never leaves a warned or banned author behind.
    const { author, title: blogTitle } = existingReport.blog;
    const isTemporary = action === ModerationAction.TEMPORARY_BAN;
    // `banUser` overwrites the expiry, so a 30-day ban would shorten a permanent one; the report still resolves.
    const isAlreadyBannedForGood =
      isTemporary && author.banned && !author.banExpires;
    let banFailed = false;

    if (action === ModerationAction.WARNING) {
      await sendWarningNotification({
        email: author.email,
        authorName: author.name,
        blogTitle,
        banReason: reasons,
      });
    } else if (
      (action === ModerationAction.TEMPORARY_BAN ||
        action === ModerationAction.PERMANENT_BAN) &&
      !isAlreadyBannedForGood
    ) {
      try {
        await auth.api.banUser({
          body: {
            userId: author.id,
            banReason: reasons,
            // 30 days in seconds; a permanent ban sets no expiry.
            ...(isTemporary && { banExpiresIn: 30 * 24 * 60 * 60 }),
          },
          headers: req.headers,
        });
      } catch (error) {
        // The review is already committed, so it isn't failed; the admin is told to ban from the users table.
        this.logger.error(
          `Failed to ban ${author.id} for report ${reportId}`,
          error,
        );
        banFailed = true;
      }

      if (!banFailed) {
        await sendBanNotification({
          email: author.email,
          authorName: author.name,
          blogTitle,
          banReason: reasons,
          banType: isTemporary ? 'temporary' : 'permanent',
        });
      }
    }

    return {
      ...updatedReport,
      status: updatedReport.status as Report['status'],
      reason: updatedReport.reason as Report['reason'],
      action: updatedReport.action as Report['action'],
      banFailed,
    };
  }
}
