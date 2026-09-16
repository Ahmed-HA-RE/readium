import { Injectable, Logger } from '@nestjs/common';
import { GetSearchSuggestions } from '@repo/types';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { Prisma } from '../generated/prisma/client';
import { SuggestionQueryDto } from './dto/suggestion-query-dto';

// The palette shows one short list per group, not a paginated result set.
const SUGGESTIONS_PER_GROUP = 3;

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
  ) {}

  private logger = new Logger(SearchService.name);

  async getSuggestions(
    query: SuggestionQueryDto,
  ): Promise<GetSearchSuggestions> {
    const { q } = query;

    this.logger.verbose('Fetching search suggestions', { q });

    // Banned accounts answer 404 on the public profile, so they must not be
    // suggested either.
    const usersWhere: Prisma.UserWhereInput = {
      NOT: { banned: true },
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    };

    const blogsWhere: Prisma.BlogWhereInput = {
      isPublished: true,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { content: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // Anonymous endpoint: `email`, `role` and every moderation column stay
    // unselected. `satisfies`, never an annotation, which collapses inference.
    const userSelect = {
      id: true,
      name: true,
      image: true,
    } satisfies Prisma.UserSelect;

    const blogSelect = {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      author: { select: { name: true } },
    } satisfies Prisma.BlogSelect;

    // Newest first, with an `id` tie-break so the same term always returns the
    // same three rows — the palette caches on `q` and must not reshuffle.
    const [users, blogs] = await Promise.all([
      this.prisma.user.findMany({
        where: usersWhere,
        select: userSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: SUGGESTIONS_PER_GROUP,
      }),
      this.prisma.blog.findMany({
        where: blogsWhere,
        select: blogSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: SUGGESTIONS_PER_GROUP,
      }),
    ]);

    return {
      users: await Promise.all(
        users.map(async (user) => ({
          ...user,
          image: user.image
            ? await this.s3Service.getSignedUrl(user.image)
            : null,
        })),
      ),
      blogs: await Promise.all(
        blogs.map(async (blog) => ({
          ...blog,
          coverImage: blog.coverImage
            ? await this.s3Service.getSignedUrl(blog.coverImage)
            : null,
        })),
      ),
    };
  }
}
