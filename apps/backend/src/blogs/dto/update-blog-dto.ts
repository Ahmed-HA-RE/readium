import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBlogDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Blog title is required' })
  @IsString()
  @MinLength(5, { message: 'Blog title must be at least 5 characters long' })
  @MaxLength(100, { message: 'Blog title must not exceed 100 characters long' })
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Blog content is required' })
  @MinLength(20, {
    message: 'Blog content must be at least 20 characters long',
  })
  content?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return value;
    }

    try {
      const parsed: unknown = JSON.parse(value);
      return parsed;
    } catch {
      return value;
    }
  })
  @IsOptional()
  @IsArray({ message: 'Blog tags must be an array of strings' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @ArrayMinSize(1, { message: 'Blog must have at least one tag' })
  @ArrayUnique({ message: 'Blog tags must be unique' })
  tags?: string[];

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  })
  @IsBoolean({ message: 'Published status must be a boolean value' })
  @IsOptional()
  isPublished: boolean;
}
