import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
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

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  page: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumberString()
  limit: string;
}
