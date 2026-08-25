import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus } from '../../../generated/prisma/enums';

export class UpdateReportStatusDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status: ReportStatus;
}
