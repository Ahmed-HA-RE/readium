import { Body, Controller, Param, Post, Session } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Roles, type UserSession } from '@thallesp/nestjs-better-auth';
import { minutes, Throttle } from '@nestjs/throttler';
import { CreateReportDto } from './dto/create-report-dto';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Method       POST /api/reports
  // Description  Create a new report
  @Throttle({ default: { ttl: minutes(1), limit: 5 } })
  @Post(':blogSlug')
  @Roles(['user'])
  createReport(
    @Param('blogSlug') blogSlug: string,
    @Body() createReportDto: CreateReportDto,
    @Session() session: UserSession,
  ) {
    const userId = session.user.id;
    return this.reportsService.createReport(createReportDto, blogSlug, userId);
  }
}
