import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export enum AdminBlogStatus {
  'PUBLISHED' = 'Published',
  'UNPUBLISHED' = 'Unpublished',
}

export class AdminBlogQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Search query must be at least 3 characters long' })
  search: string;

  @IsOptional()
  @IsEnum(AdminBlogStatus)
  status: AdminBlogStatus;

  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const parsedValue = Number(value);

    return parsedValue;
  })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Page number must be greater than or equal to 1' })
  page: number;

  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const parsedValue = Number(value);

    return parsedValue;
  })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Limit must be greater than or equal to 1' })
  limit: number;
}
