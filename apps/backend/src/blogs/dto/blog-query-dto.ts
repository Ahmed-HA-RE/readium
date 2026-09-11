import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  IsInt,
} from 'class-validator';

export enum BlogSortOptions {
  'NEWEST' = 'newest',
  'OLDEST' = 'oldest',
  'MOST_LIKED' = 'most_liked',
}

export class BlogQueryDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  search: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(BlogSortOptions)
  sort: BlogSortOptions;

  @Type(() => Number)
  @IsOptional()
  @IsNotEmpty()
  @Min(1)
  @IsInt()
  page: number;

  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  @IsInt()
  limit: number;
}
