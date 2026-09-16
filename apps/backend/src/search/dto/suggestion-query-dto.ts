import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Query of `GET /api/search/suggestions`. `q` is optional: the palette opens
// with no term and gets the latest rows. `@IsNotEmpty` still rejects `?q=`,
// which would otherwise reach Prisma as a `contains: ''` matching everything.
export class SuggestionQueryDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100, {
    message: 'Search term must be at most 100 characters long',
  })
  q?: string;
}
