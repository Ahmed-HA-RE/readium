import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsDefined,
} from 'class-validator';

export class CreateCommentDto {
  @IsDefined({ message: 'Comment content is required' })
  @IsString()
  @IsNotEmpty({ message: 'Comment content must not be empty' })
  @MinLength(3, {
    message: 'Comment content must be at least 3 characters long',
  })
  @MaxLength(500, { message: 'Comment content must not exceed 500 characters' })
  content: string;
}
