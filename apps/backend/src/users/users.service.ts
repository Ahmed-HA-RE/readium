import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GetUserProfileWithBlogs } from '@repo/types';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { Prisma } from '../generated/prisma/client';
import { buildBlogQuery } from '../blogs/utils/blog-query';
import { UserBlogsQueryDto } from './dto/user-blogs-query-dto';
import { buildUserBlogsFilter } from './utils/user-query';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
  ) {}

  private logger = new Logger(UsersService.name);

  async getUserProfileWithBlogs(
    username: string,
    query: UserBlogsQueryDto,
  ): Promise<GetUserProfileWithBlogs> {
    const { search, sort, page, limit } = query;

    this.logger.verbose(
      `Fetching the public profile of ${username} with query parameters`,
      { search, sort, page, limit },
    );

    // Sorting and pagination are shared with the blog feed. The filter is not:
    // these blogs belong to one author already, so `buildUserBlogsFilter`
    // searches the title and the content only.
    const { querySort, limitValue, pageValue } = buildBlogQuery(
      undefined,
      sort,
      page,
      limit,
    );

    const blogsWhere: Prisma.BlogWhereInput = {
      ...buildUserBlogsFilter(search),
      isPublished: true,
    };

    // `banned` is selected so a banned account can answer 404, but it is
    // stripped below and never reaches the response.
    const publicUserSelect = {
      name: true,
      bio: true,
      website: true,
      image: true,
      banned: true,
      blogs: {
        where: blogsWhere,
        orderBy: querySort,
        skip: (pageValue - 1) * limitValue,
        take: limitValue,
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          tags: true,
          coverImage: true,
          createdAt: true,
          _count: {
            select: {
              comments: true,
              likes: true,
              bookmarks: true,
            },
          },
        },
      },
    } satisfies Prisma.UserSelect;

    const [user, totalBlogs] = await Promise.all([
      this.prisma.user.findUnique({
        where: { name: username },
        select: publicUserSelect,
      }),
      this.prisma.blog.count({
        where: { ...blogsWhere, author: { name: username } },
      }),
    ]);

    // A banned user is reported as missing rather than banned, so a reader
    // cannot tell the two apart.
    if (!user || user.banned) {
      throw new NotFoundException(
        `User with username ${username} does not exist`,
      );
    }

    const totalPages = Math.ceil(totalBlogs / limitValue);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { banned, blogs, ...profile } = user;

    const blogsWithPresignedUrls = await Promise.all(
      blogs.map(async (blog) => ({
        ...blog,
        coverImage: blog.coverImage
          ? await this.s3Service.getSignedUrl(blog.coverImage)
          : null,
      })),
    );

    return {
      user: {
        ...profile,
        image: profile.image
          ? await this.s3Service.getSignedUrl(profile.image)
          : null,
      },
      blogs: blogsWithPresignedUrls,
      totalPages,
    };
  }
}
