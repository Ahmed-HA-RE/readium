import { Transform, Type } from 'class-transformer';
import { ADMIN_TABLE_PAGE_SIZES } from '@repo/constants';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UserQueryDto {
  @IsOptional()
  @MinLength(3, { message: 'Search term must be at least 3 characters long' })
  @MaxLength(50, { message: 'Search term must not exceed 50 characters long' })
  search?: string;

  @Transform(({ value }: { value: string }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsOptional()
  @IsBoolean({ message: 'Banned must be a boolean value' })
  banned?: boolean;

  @Transform(({ value }: { value: string }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsOptional()
  @IsBoolean({ message: 'Email Verified must be a boolean value' })
  emailVerified?: boolean;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1, { message: 'Page number must be greater than or equal to 1' })
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsInt()
  @IsIn(ADMIN_TABLE_PAGE_SIZES, {
    message: `Limit must be one of ${ADMIN_TABLE_PAGE_SIZES.join(', ')}`,
  })
  limit?: number;
}
