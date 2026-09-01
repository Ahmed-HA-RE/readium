import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  name?: string;

  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Website must be a valid URL' },
  )
  @IsNotEmpty()
  website?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Bio must be at least 10 characters long' })
  @MaxLength(500, { message: 'Bio must not exceed 500 characters long' })
  bio?: string;
}
