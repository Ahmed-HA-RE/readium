import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ReportReason, ReportStatus } from '../../../generated/prisma/enums';
import { Transform } from 'class-transformer';

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

  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    const parsedValue = Number(value);

    if (isNaN(parsedValue)) {
      return undefined;
    }
    return parsedValue;
  })
  @IsOptional()
  page: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    const parsedValue = Number(value);

    if (isNaN(parsedValue)) {
      return undefined;
    }
    return parsedValue;
  })
  @IsOptional()
  limit: number;
}
