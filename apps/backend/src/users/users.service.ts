import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GetMyBlogs, GetUserProfileWithBlogs } from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { Prisma } from '../generated/prisma/client';
import { buildBlogQuery } from '../blogs/utils/blog-query';
import { UserBlogsQueryDto } from './dto/user-blogs-query-dto';
import { buildUserBlogsFilter } from './utils/user-query';

// Subscriptions are not implemented yet, so there is nothing to derive this
// from. Replace it once the subscription model lands — the same placeholder
// situation as `PLACEHOLDER_TOTAL_SUBSCRIBERS` in `admin.service.ts`.
const PLACEHOLDER_IS_PRO = true;

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

  /**
   * The signed-in user's own profile, for the dashboard sidebar.
   *
   * No database read: the guard has already resolved the session, so both
   * objects are returned exactly as better-auth built them rather than being
   * re-queried and reassembled. The return type is derived from `UserSession`
   * for that reason — it is the type the guard actually hands over, so the
   * response cannot drift from it. `@repo/types` mirrors this shape by hand as
   * `GetCurrentLoggedInUser` for the Next.js app; keep the two in step.
   *
   * Only `image` is rewritten: the column holds an S3 key, and the sidebar
   * needs a URL it can render.
   */
  async getCurrentLoggedInUser(
    session: UserSession,
  ): Promise<UserSession & { user: { isPro: boolean } }> {
    const { user } = session;

    this.logger.verbose(`Fetching the dashboard profile of ${user.name}`);

    return {
      ...session,
      user: {
        ...user,
        image: user.image
          ? await this.s3Service.getSignedUrl(user.image)
          : null,
        isPro: PLACEHOLDER_IS_PRO,
      },
    };
  }

  /**
   * The signed-in user's own blogs, drafts included.
   *
   * The author is fixed to `user.id` from the session; no caller-supplied
   * identifier reaches the `where` clause, so one user cannot read another's
   * blogs. Sorting and pagination come from `buildBlogQuery`, but its
   * `queryFilter` is deliberately unused — it also matches `author.name`,
   * which would make a search for the caller's own username return every one
   * of their blogs regardless of the term.
   */
  async getMyBlogs(
    user: UserSession['user'],
    query: UserBlogsQueryDto,
  ): Promise<GetMyBlogs> {
    const { search, sort, page, limit } = query;

    this.logger.verbose(`Fetching the blogs of ${user.name}`, {
      search,
      sort,
      page,
      limit,
    });

    const { querySort, limitValue, pageValue } = buildBlogQuery(
      undefined,
      sort,
      page,
      limit,
    );

    // Scoped by the session user's id. Drafts are included: these are the
    // caller's own blogs, and the dashboard lists both.
    const blogsWhere: Prisma.BlogWhereInput = {
      ...buildUserBlogsFilter(search),
      authorId: user.id,
    };

    const myBlogsSelect = {
      id: true,
      title: true,
      slug: true,
      content: true,
      tags: true,
      coverImage: true,
      isPublished: true,
      createdAt: true,
      _count: {
        select: {
          comments: true,
          likes: true,
          bookmarks: true,
        },
      },
    } satisfies Prisma.BlogSelect;

    const [blogs, totalBlogs] = await Promise.all([
      this.prisma.blog.findMany({
        where: blogsWhere,
        orderBy: querySort,
        skip: (pageValue - 1) * limitValue,
        take: limitValue,
        select: myBlogsSelect,
      }),
      this.prisma.blog.count({ where: blogsWhere }),
    ]);

    const blogsWithPresignedUrls = await Promise.all(
      blogs.map(async (blog) => ({
        ...blog,
        coverImage: blog.coverImage
          ? await this.s3Service.getSignedUrl(blog.coverImage)
          : null,
      })),
    );

    return {
      blogs: blogsWithPresignedUrls,
      totalPages: Math.ceil(totalBlogs / limitValue),
    };
  }
}
