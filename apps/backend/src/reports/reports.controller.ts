import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Session,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Roles, type UserSession } from '@thallesp/nestjs-better-auth';
import { ReportQueryDto } from './dto/report-query-dto';
import { CreateReportDto } from './dto/create-report-dto';
import { UpdateReportStatusDto } from './dto/update-report-dto';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Method       GET /api/reports
  // Description  Get all reports
  @Get()
  @Roles(['admin'])
  getAllReports(@Query() query: ReportQueryDto) {
    return this.reportsService.getAllReports(query);
  }

  // Method       POST /api/reports
  // Description  Create a new report
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

  // Method       PUT /api/reports/:reportId/status
  // Description  Update an existing report
  @Put(':reportId/status')
  @Roles(['admin'])
  updateReport(
    @Param('reportId') reportId: string,
    @Body() updateReportDto: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateReport(reportId, updateReportDto);
  }
}
