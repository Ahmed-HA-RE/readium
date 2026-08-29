import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  Session,
} from '@nestjs/common';
import { Roles, type UserSession } from '@thallesp/nestjs-better-auth';
import { ReportQueryDto } from './dto/report-query-dto';
import { AdminReportsService } from './admin-reports.service';
import { UpdateReportStatusDto } from './dto/update-report-dto';

@Controller('api/admin/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

  // Method       GET /api/reports
  // Description  Get all reports
  @Get()
  @Roles(['admin'])
  getAllReports(@Query() query: ReportQueryDto) {
    return this.reportsService.getAllReportsAsAdmin(query);
  }

  // Method       PUT /api/reports/:reportId/status
  // Description  Update an existing report
  @Put(':reportId/status')
  @Roles(['admin'])
  updateReport(
    @Param('reportId') reportId: string,
    @Body() updateReportDto: UpdateReportStatusDto,
    @Req() req: Request,
    @Session() session: UserSession,
  ) {
    const user = session.user;
    return this.reportsService.updateReportStatusAsAdmin(
      reportId,
      updateReportDto,
      req,
      user,
    );
  }
}
