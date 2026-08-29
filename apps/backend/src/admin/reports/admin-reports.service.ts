import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationAction,
  UpdateReportStatusDto,
} from './dto/update-report-dto';
import {
  GetAllReportsWithFilters,
  Report,
  ReportReason,
  ReportStatus,
} from '@repo/types';
import { DatabaseService } from '../../database/database.service';
import { Prisma } from '../../generated/prisma/client';
import { ReportQueryDto } from './dto/report-query-dto';
import { auth } from '../../../lib/auth';
import { UserSession } from '@thallesp/nestjs-better-auth';
import sendBanNotification from '../../../mails/send-ban-notification';
import sendWarningNotification from '../../../mails/send-warning-notification';

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: DatabaseService) {}

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

    const limitValue = limit ? limit : 10;
    const pageValue = page ? page : 1;
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
    return {
      reports: reports.map((report) => ({
        ...report,
        reason: report.reason as ReportReason,
        status: report.status as ReportStatus,
      })),
      totalPages,
    };
  }

  async updateReportStatusAsAdmin(
    reportId: string,
    updateReportDto: UpdateReportStatusDto,
    req: Request,
    user: UserSession['user'],
  ): Promise<Report> {
    const { status, action } = updateReportDto;

    const resolvedStatus = status === 'RESOLVED';

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
    if (existingReport.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot update report with status ${existingReport.status}. Only reports with status of pending can be updated.`,
      );
    }

    // Prevent admin users from banning themselves
    if (existingReport.blog.author.id === user.id) {
      throw new BadRequestException(
        'Admin users cannot perform moderation actions on themselves.',
      );
    }
    // Prevent moderation actions on admin users
    if (existingReport.blog.author.role === 'admin') {
      throw new BadRequestException(
        'Cannot perform moderation actions on admin users.',
      );
    }

    // Should not ban or warn users if the report is rejected
    if (status === 'REJECTED' && action) {
      throw new BadRequestException(
        'Cannot perform moderation actions on rejected reports.',
      );
    }

    if (resolvedStatus && action === ModerationAction.WARNING) {
      await sendWarningNotification({
        email: existingReport.blog.author.email,
        authorName: existingReport.blog.author.name,
        blogTitle: existingReport.blog.title,
        banReason: existingReport.reason,
      });
    } else if (resolvedStatus && action === ModerationAction.TEMPORARY_BAN) {
      // Ban the user for (30 days)
      await auth.api.banUser({
        body: {
          userId: existingReport.blog.author.id,
          banExpiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
          banReason: existingReport.reason,
        },
        headers: req.headers,
      });
      await sendBanNotification({
        email: existingReport.blog.author.email,
        authorName: existingReport.blog.author.name,
        blogTitle: existingReport.blog.title,
        banReason: existingReport.reason,
        banType: 'temporary',
      });
    } else if (resolvedStatus && action === ModerationAction.PERMANENT_BAN) {
      await auth.api.banUser({
        body: {
          userId: existingReport.blog.author.id,
          banReason: existingReport.reason,
        },
        headers: req.headers,
      });
      await sendBanNotification({
        email: existingReport.blog.author.email,
        authorName: existingReport.blog.author.name,
        blogTitle: existingReport.blog.title,
        banReason: existingReport.reason,
        banType: 'permanent',
      });
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: status,
      },
    });

    if (updatedReport.status === 'RESOLVED') {
      // unpublish the blog post
      await this.prisma.blog.update({
        where: {
          id: updatedReport.blogId,
          authorId: existingReport.blog.author.id,
        },
        data: {
          isPublished: false,
        },
      });
    }

    return {
      ...updatedReport,
      status: updatedReport.status as ReportStatus,
      reason: updatedReport.reason as ReportReason,
    };
  }
}
