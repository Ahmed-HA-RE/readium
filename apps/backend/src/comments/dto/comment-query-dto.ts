import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CommentQueryDto {
  // `@IsInt` rejects a fractional limit, which Prisma's `take` refuses, and the
  // `NaN` a non-numeric param transforms into. `@Min(1)` rejects 0, which used
  // to reach the cursor feeds as `take: 0`.
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsUUID('4')
  @IsOptional()
  @IsNotEmpty()
  cursor?: string;
}
