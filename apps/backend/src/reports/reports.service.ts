import { Injectable, Logger } from '@nestjs/common';
import { ReportQueryDto } from './dto/report-query-dto';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '../generated/prisma/client';
import { GetAllReportsWithFilters } from '@repo/types';
import type { ReportReason, ReportStatus } from '@repo/types';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: DatabaseService) {}

  private logger = new Logger(ReportsService.name);

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
}
