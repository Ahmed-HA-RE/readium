import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Offset pagination only — both tabs are fixed to newest-saved-first, so
// `BlogQueryDto` is not extended. `@Min(1)` is what stops `page=0` reaching
// Prisma as a negative `skip`.
export class LikesAndBookmarksQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
