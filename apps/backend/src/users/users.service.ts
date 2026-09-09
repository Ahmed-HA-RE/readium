import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  GetMyBlogs,
  GetMyComments,
  GetMyLikesAndBookmarks,
  GetUserProfileWithBlogs,
  LikesAndBookmarksBlogCard,
} from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { Prisma } from '../generated/prisma/client';
import { buildBlogQuery } from '../blogs/utils/blog-query';
import { UserBlogsQueryDto } from './dto/user-blogs-query-dto';
import { CommentQueryDto } from '../comments/dto/comment-query-dto';
import { LikesAndBookmarksQueryDto } from './dto/likes-and-bookmarks-query-dto';
import {
  buildLikesAndBookmarksFilter,
  buildLikesAndBookmarksPage,
  buildUserBlogsFilter,
  likesAndBookmarksOrder,
  likesAndBookmarksSelect,
} from './utils/user-query';

// Subscriptions are not implemented yet, so there is nothing to derive this
// from. Replace it once the subscription model lands — the same placeholder
// situation as `PLACEHOLDER_TOTAL_SUBSCRIBERS` in `admin.service.ts`.
const PLACEHOLDER_IS_PRO = true;

// Matches the default the admin comment feed uses, so both cursor endpoints
// page at the same size when the client sends no `limit`.
const DEFAULT_COMMENTS_PAGE_SIZE = 10;

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

  /**
   * The signed-in user's own comments, newest first.
   *
   * Cursor-paginated with no filter and no sort: the dashboard's Comments tab
   * is a plain reverse-chronological feed, so `CommentQueryDto` is reused for
   * `limit` and `cursor` and nothing else is accepted.
   *
   * The author is fixed to `user.id` from the session — no caller-supplied
   * identifier reaches the `where` clause, so one user cannot read another's
   * comments.
   */
  async getMyComments(
    user: UserSession['user'],
    query: CommentQueryDto,
  ): Promise<GetMyComments> {
    const { limit, cursor } = query;
    const take = limit ?? DEFAULT_COMMENTS_PAGE_SIZE;

    this.logger.verbose(`Fetching the comments of ${user.name}`, {
      limit,
      cursor,
    });

    const comments = await this.prisma.comment.findMany({
      where: { authorId: user.id },
      take,
      // `skip: 1` steps over the cursor row itself, which the client already
      // has as the last row of the previous page.
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      // `createdAt` alone is not a unique ordering, so a cursor on `id` would
      // sit at an ambiguous position whenever two comments share a timestamp
      // and rows would be skipped or repeated across pages. History #2 records
      // this exact bug on the admin feed — do not drop the `id` tie-break.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });

    // Every one of these comments is the caller's own, so the author is the
    // session user and the avatar is signed once here rather than per row.
    const image = user.image
      ? await this.s3Service.getSignedUrl(user.image)
      : null;
    const author = { name: user.name, image };

    return {
      data: comments.map((comment) => ({ ...comment, author })),
      // A short page is the last page, so there is nothing further to fetch.
      // Returning the last id unconditionally would cost the client one extra
      // round trip to discover the feed had already ended.
      //
      // The emptiness check guards the index. `@Min(1)` on the DTO means `take`
      // can no longer be 0, so `length === take` already implies a non-empty
      // page — but when both were zero this indexed `[-1]` and threw, so the
      // check stays as the second line of defence.
      nextCursor:
        comments.length > 0 && comments.length === take
          ? comments[comments.length - 1].id
          : null,
    };
  }

  /**
   * Blogs the signed-in user has liked, newest like first.
   *
   * Offset-paginated so the tab does not load the caller's entire history at
   * once. Not filtered or sorted: the ordering is fixed to when they liked the
   * blog.
   */
  async getMyLikes(
    user: UserSession['user'],
    query: LikesAndBookmarksQueryDto,
  ): Promise<GetMyLikesAndBookmarks> {
    const { page, limit } = query;

    this.logger.verbose(`Fetching the liked blogs of ${user.name}`, {
      page,
      limit,
    });

    const { skip, take, limitValue } = buildLikesAndBookmarksPage(page, limit);
    const where = buildLikesAndBookmarksFilter(user.id);

    const [likes, totalLikes] = await Promise.all([
      this.prisma.like.findMany({
        where,
        orderBy: likesAndBookmarksOrder,
        skip,
        take,
        select: { blog: { select: likesAndBookmarksSelect } },
      }),
      this.prisma.like.count({ where }),
    ]);

    return {
      blogs: await this.presignBlogCards(likes),
      totalPages: Math.ceil(totalLikes / limitValue),
    };
  }

  /**
   * Blogs the signed-in user has bookmarked, newest bookmark first.
   *
   * Identical in every respect to `getMyLikes` but for the table it reads;
   * both tabs render the same card and page the same way.
   */
  async getMyBookmarks(
    user: UserSession['user'],
    query: LikesAndBookmarksQueryDto,
  ): Promise<GetMyLikesAndBookmarks> {
    const { page, limit } = query;

    this.logger.verbose(`Fetching the bookmarked blogs of ${user.name}`, {
      page,
      limit,
    });

    const { skip, take, limitValue } = buildLikesAndBookmarksPage(page, limit);
    const where = buildLikesAndBookmarksFilter(user.id);

    const [bookmarks, totalBookmarks] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        orderBy: likesAndBookmarksOrder,
        skip,
        take,
        select: { blog: { select: likesAndBookmarksSelect } },
      }),
      this.prisma.bookmark.count({ where }),
    ]);

    return {
      blogs: await this.presignBlogCards(bookmarks),
      totalPages: Math.ceil(totalBookmarks / limitValue),
    };
  }

  /**
   * Unwraps the join rows a likes or bookmarks query returns and swaps both
   * stored S3 keys — the cover image and the author's avatar — for signed URLs.
   *
   * `LikesAndBookmarksBlogCard` types the input as well as the output: the
   * fields hold S3 keys going in and URLs coming out, which is the same shape
   * either way.
   *
   * Shared by both endpoints. `Like` and `Bookmark` are distinct Prisma models,
   * so their payload types are unrelated even though the blog they select is
   * identical — hence the structural parameter type rather than one derived
   * from either model.
   */
  private async presignBlogCards(
    rows: { blog: LikesAndBookmarksBlogCard }[],
  ): Promise<LikesAndBookmarksBlogCard[]> {
    return Promise.all(
      rows.map(async ({ blog }) => ({
        ...blog,
        coverImage: blog.coverImage
          ? await this.s3Service.getSignedUrl(blog.coverImage)
          : null,
        author: {
          ...blog.author,
          image: blog.author.image
            ? await this.s3Service.getSignedUrl(blog.author.image)
            : null,
        },
      })),
    );
  }
}
