import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ADMIN_TABLE_PAGE_SIZES } from '@repo/constants';
import { ReportReason, ReportStatus } from '../../../generated/prisma/enums';
import { Type } from 'class-transformer';

export class ReportQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(3, {
    message: 'Reporter name must be at least 3 characters long.',
  })
  @MaxLength(50, {
    message: 'Reporter name must not exceed 50 characters long.',
  })
  reporterName: string;

  @IsOptional()
  @IsEnum(ReportReason as object)
  reason: ReportReason;

  @IsOptional()
  @IsEnum(ReportStatus as object)
  status: ReportStatus;

  // Set by a report notification's link, so the table opens on that one report.
  @IsOptional()
  @IsUUID('4')
  reportId?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsIn(ADMIN_TABLE_PAGE_SIZES, {
    message: `Limit must be one of ${ADMIN_TABLE_PAGE_SIZES.join(', ')}`,
  })
  limit?: number;
}
