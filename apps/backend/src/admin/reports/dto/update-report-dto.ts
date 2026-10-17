import { IsEnum, IsIn, ValidateIf } from 'class-validator';
import {
  ModerationAction,
  ReportStatus,
} from '../../../generated/prisma/enums';

export class UpdateReportStatusDto {
  @IsIn([ReportStatus.REJECTED, ReportStatus.RESOLVED])
  status: ReportStatus;

  @ValidateIf((o: UpdateReportStatusDto) => o.status === ReportStatus.RESOLVED)
  @IsEnum(ModerationAction)
  action?: ModerationAction;
}
