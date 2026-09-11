import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
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

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
