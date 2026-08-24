import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReportQueryDto } from './dto/report-query-dto';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '../generated/prisma/client';
import { GetAllReportsWithFilters } from '@repo/types';
import type { Report, ReportReason, ReportStatus } from '@repo/types';
import { CreateReportDto } from './dto/create-report-dto';
import sendReportConfirmation from '../../mails/send-report-confirmation';
import { UpdateReportStatusDto } from './dto/update-report-dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: DatabaseService) {}

  private logger = new Logger(ReportsService.name);

  private async findBlogBySlug(
    blogSlug: string,
    userId: string,
  ): Promise<{ id: string }> {
    const blog = await this.prisma.blog.findUnique({
      where: {
        slug: blogSlug,
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
    return blog;
  }

  private async userAlreadyReportedBlog(
    blogId: string,
    userId: string,
  ): Promise<void> {
    const existingReport = await this.prisma.report.findFirst({
      where: {
        blogId,
        userId,
      },
    });

    if (existingReport) {
      throw new BadRequestException(
        `You have already reported this blog. You cannot report the same blog multiple times.`,
      );
    }
  }

  async getAllReports(
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

  async createReport(
    createReportDto: CreateReportDto,
    blogSlug: string,
    userId: string,
  ): Promise<Report> {
    const blog = await this.findBlogBySlug(blogSlug, userId);

    // Check if the user has already reported this blog
    await this.userAlreadyReportedBlog(blog.id, userId);

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

    // Send an email notification to the reporter about the report creation.
    await sendReportConfirmation({
      createdAt: newReport.createdAt,
      reporterEmail: newReport.user.email,
      reporterName: newReport.user.name,
      referenceId: newReport.id,
      blogTitle: newReport.blog.title,
    });

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

  async updateReport(
    reportId: string,
    updateReportDto: UpdateReportStatusDto,
  ): Promise<Report> {
    const existingReport = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!existingReport) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: updateReportDto,
    });

    return {
      ...updatedReport,
      status: updatedReport.status as ReportStatus,
      reason: updatedReport.reason as ReportReason,
    };
  }
}
