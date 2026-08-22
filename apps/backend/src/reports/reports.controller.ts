import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Roles } from '@thallesp/nestjs-better-auth';
import { ReportQueryDto } from './dto/report-query-dto';

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
}
