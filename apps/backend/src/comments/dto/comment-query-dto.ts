import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CommentQueryDto {
  @IsNumberString()
  @IsOptional()
  @IsNotEmpty()
  limit?: string;

  @IsUUID('4')
  @IsOptional()
  @IsNotEmpty()
  cursor?: string;
}
