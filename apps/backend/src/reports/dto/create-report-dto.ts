import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReportReason } from '../../generated/prisma/enums';

export class CreateReportDto {
  @IsNotEmpty()
  @IsEnum(ReportReason)
  reason: ReportReason;
}
