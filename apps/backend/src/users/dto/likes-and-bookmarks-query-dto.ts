import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Query for both `GET /api/users/me/likes` and `GET /api/users/me/bookmarks` —
 * the two tabs page identically, so they share one DTO.
 *
 * Offset pagination and nothing else: both tabs are fixed to newest-saved-first
 * with no search and no sort, so `BlogQueryDto` is not extended — inheriting it
 * would advertise `search` and `sort` parameters that these endpoints ignore.
 *
 * Both fields are transformed to numbers and constrained to positive integers
 * (`@IsInt` also rejects a fractional `limit`, which Prisma's `take` refuses,
 * and catches the `NaN` that a non-numeric param transforms into), rather than
 * `@IsNumberString()` as `BlogQueryDto`'s are. A query param arrives as a
 * string either way, but validating it as a number is what lets `@Min(1)`
 * reject `page=0` — which would otherwise reach Prisma as a negative `skip` —
 * and it hands the service a real number, so no call site has to parse one.
 */
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
  limit?: number;
}
