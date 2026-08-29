import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus } from '../../../generated/prisma/enums';

export enum ModerationAction {
  WARNING = 'WARNING',
  TEMPORARY_BAN = 'TEMPORARY_BAN',
  PERMANENT_BAN = 'PERMANENT_BAN',
}

export class UpdateReportStatusDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsEnum(ModerationAction)
  action: ModerationAction;
}
