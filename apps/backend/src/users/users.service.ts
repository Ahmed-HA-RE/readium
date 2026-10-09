import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  GetCurrentLoggedInUser,
  GetMyBlogs,
  GetMyComments,
  GetMyLikesAndBookmarks,
  GetUserBlogs,
  LikesAndBookmarksBlogCard,
  LinkedAccount,
  PublicUserProfile,
  UpdateUserProfile,
} from '@repo/types';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { BlogsService } from '../blogs/blogs.service';
import { Prisma } from '../generated/prisma/client';
import { buildBlogQuery } from '../blogs/utils/blog-query';
import { UserBlogsQueryDto } from './dto/user-blogs-query-dto';
import { MyBlogsQueryDto, MyBlogsStatus } from './dto/my-blogs-query-dto';
import { CommentQueryDto } from '../comments/dto/comment-query-dto';
import { LikesAndBookmarksQueryDto } from './dto/likes-and-bookmarks-query-dto';
import { UpdateUserProfileDto } from './dto/update-user-profile-dto';
import { generateImageKey } from '../../lib/utils';
import { ABANDONED_CHECKOUT_STATUSES } from '../../lib/constants';
import {
  buildLikesAndBookmarksFilter,
  buildLikesAndBookmarksPage,
  buildUserBlogsFilter,
  likesAndBookmarksOrder,
  likesAndBookmarksSelect,
} from './utils/user-query';

// Matches the Stripe plugin's own "active or trialing" check behind `subscription.list`.
const PRO_STATUSES = ['active', 'trialing'];

// Matches the admin comment feed's default, so both cursor endpoints page alike.
const DEFAULT_COMMENTS_PAGE_SIZE = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
    private readonly blogsService: BlogsService,
  ) {}

  private logger = new Logger(UsersService.name);

  async getPublicUserProfile(username: string): Promise<PublicUserProfile> {
    this.logger.verbose(`Fetching the public profile of ${username}`);

    const publishedBlog = { blog: { isPublished: true } };

    // `banned` is selected only to answer 404 below; it never reaches the
    // response, and `email`, `role` and `banReason` are never selected at all.
    // Case-insensitive, like `isUsernameTaken`, so `/@ahmed` finds `Ahmed`; the
    // web page then redirects to the canonical casing.
    const user = await this.prisma.user.findFirst({
      where: { name: { equals: username, mode: 'insensitive' } },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        banned: true,
        _count: {
          select: {
            blogs: { where: { isPublished: true } },
            likes: { where: publishedBlog },
            bookmarks: { where: publishedBlog },
          },
        },
      },
    });

    // A banned user answers 404, so it is indistinguishable from one that
    // never existed.
    if (!user || user.banned) {
      throw new NotFoundException(
        `User with username ${username} does not exist`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { banned, ...profile } = user;

    // Only `isPro` is public; whether someone subscribed in the past stays private.
    const [image, { isPro }] = await Promise.all([
      profile.image ? this.s3Service.getSignedUrl(profile.image) : null,
      this.getSubscriptionState(profile.id),
    ]);

    return { ...profile, image, isPro };
  }

  /**
   * A user's published blogs as feed cards, filtered, sorted and paginated.
   * Blogs the caller reported are hidden from the caller only, as in the feed.
   */
  async getUserBlogs(
    username: string,
    query: UserBlogsQueryDto,
    userId?: string,
  ): Promise<GetUserBlogs> {
    const { search, sort, page, limit } = query;

    this.logger.verbose(`Fetching the blogs of ${username}`, {
      search,
      sort,
      page,
      limit,
    });

    const author = await this.prisma.user.findFirst({
      where: { name: { equals: username, mode: 'insensitive' } },
      select: { id: true, banned: true },
    });

    if (!author || author.banned) {
      throw new NotFoundException(
        `User with username ${username} does not exist`,
      );
    }

    // Sorting and pagination are shared with the blog feed; the filter is not,
    // since these blogs already belong to one author.
    const { querySort, limitValue, pageValue } = buildBlogQuery(
      undefined,
      sort,
      page,
      limit,
    );

    const where: Prisma.BlogWhereInput = {
      ...buildUserBlogsFilter(search),
      authorId: author.id,
      isPublished: true,
      ...(userId ? { report: { none: { userId } } } : {}),
    };

    return this.blogsService.findBlogCards(
      where,
      querySort,
      pageValue,
      limitValue,
      userId,
    );
  }

  /**
   * The signed-in user's own profile from the session, plus their subscription
   * state — `image` is rewritten from an S3 key to a URL.
   *
   * `GetCurrentLoggedInUser` in `@repo/types` mirrors this shape by hand; keep
   * the two in step.
   */
  async getCurrentLoggedInUser(
    session: UserSession,
  ): Promise<GetCurrentLoggedInUser> {
    const { user } = session;

    this.logger.verbose(`Fetching the profile: ${user.name}`);

    const [image, subscriptionState] = await Promise.all([
      user.image ? this.s3Service.getSignedUrl(user.image) : null,
      this.getSubscriptionState(user.id),
    ]);

    return {
      ...session,
      user: { ...user, image, ...subscriptionState },
    };
  }

  /**
   * The signed-in user's own published or draft blogs, per `status`, scoped to
   * `user.id` from the session so no caller-supplied identifier reaches the
   * `where` clause.
   *
   * `buildBlogQuery`'s `queryFilter` is deliberately unused: it also matches
   * `author.name`, which would return every blog on a self-username search.
   */
  async getMyBlogs(
    user: UserSession['user'],
    query: MyBlogsQueryDto,
  ): Promise<GetMyBlogs> {
    const { status, search, sort, page, limit } = query;

    this.logger.verbose(`Fetching the ${status} blogs of ${user.name}`, {
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

    const blogsWhere: Prisma.BlogWhereInput = {
      ...buildUserBlogsFilter(search),
      authorId: user.id,
      isPublished: status === MyBlogsStatus.PUBLISHED,
    };

    // No `content`: the dashboard card renders `shortDescription`, so a page
    // of full bodies would be dead weight.
    const myBlogsSelect = {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
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

    const [blogs, totalBlogs, statusGroups] = await Promise.all([
      this.prisma.blog.findMany({
        where: blogsWhere,
        orderBy: querySort,
        skip: (pageValue - 1) * limitValue,
        take: limitValue,
        select: myBlogsSelect,
      }),
      this.prisma.blog.count({ where: blogsWhere }),
      // Both tab badges in one query. Unfiltered by search: they are totals.
      this.prisma.blog.groupBy({
        by: ['isPublished'],
        where: { authorId: user.id },
        _count: { _all: true },
      }),
    ]);

    const countFor = (isPublished: boolean) =>
      statusGroups.find((group) => group.isPublished === isPublished)?._count
        ._all ?? 0;

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
      counts: { published: countFor(true), draft: countFor(false) },
    };
  }

  /**
   * The signed-in user's own comments, newest first, cursor-paginated with no
   * filter or sort. Scoped to `user.id` from the session.
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
      // `skip: 1` steps over the cursor row, which the client already has.
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      // Do not drop the `id` tie-break: `createdAt` alone is not unique, which
      // makes the cursor ambiguous and pages skip or repeat rows.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        content: true,
        createdAt: true,
        blog: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            isPublished: true,
            shortDescription: true,
            // The card links to `/@<author>/<slug>`, so the blog's author is needed.
            author: { select: { name: true } },
          },
        },
      },
    });

    // Every comment is the caller's own, so the avatar is signed once here
    // rather than per row.
    const image = user.image
      ? await this.s3Service.getSignedUrl(user.image)
      : null;
    const author = { name: user.name, image };

    return {
      data: await Promise.all(
        comments.map(async (comment) => ({
          ...comment,
          author,
          blog: {
            ...comment.blog,
            coverImage: comment.blog.coverImage
              ? await this.s3Service.getSignedUrl(comment.blog.coverImage)
              : null,
          },
        })),
      ),
      // A short page is the last page. The emptiness check guards the index —
      // `@Min(1)` on the DTO makes it redundant, but it stays as a backstop.
      nextCursor:
        comments.length > 0 && comments.length === take
          ? comments[comments.length - 1].id
          : null,
    };
  }

  /**
   * Blogs the signed-in user has liked, newest like first. Offset-paginated,
   * not filtered or sorted.
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
   * Blogs the signed-in user has bookmarked, newest bookmark first. Identical
   * to `getMyLikes` but for the table it reads.
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
   * Updates the signed-in user's own profile. Only `name`, `bio`, `website`
   * and the avatar are writable — the DTO carries no other field.
   */
  async updateUserProfile(
    user: UserSession['user'],
    updateUserProfileDto: UpdateUserProfileDto,
    profileImage?: Express.Multer.File,
  ): Promise<UpdateUserProfile> {
    const { name, bio, website } = updateUserProfileDto;

    this.logger.log(`Updating the profile of ${user.name}`);

    // Read the row rather than trusting `user.image` from the session, which
    // goes stale after an earlier update and would delete the wrong object.
    const existingUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, image: true },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with id ${user.id} does not exist`);
    }

    // Compared case-insensitively, and skipped when the name is unchanged so a
    // user is not blocked by their own row.
    if (name && name.toLowerCase() !== existingUser.name.toLowerCase()) {
      if (await this.isUsernameTaken(name)) {
        throw new BadRequestException(`${name} name is already taken`);
      }
    }

    let imageKey: string | null = null;

    if (profileImage) {
      imageKey = generateImageKey({
        userId: existingUser.id,
        fileName: profileImage.originalname,
      });
      await this.s3Service.uploadFile(profileImage, imageKey);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        bio,
        website,
        image: imageKey ?? existingUser.image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
      },
    });

    // Only after the row is updated, so a failed write cannot orphan the avatar
    // the user still has.
    if (imageKey && existingUser.image) {
      try {
        await this.s3Service.deleteFile(existingUser.image);
      } catch {
        // The update itself succeeded, so this must not fail the request — it
        // only leaves an unreferenced object behind.
        this.logger.error(
          `Failed to delete the previous avatar ${existingUser.image}`,
        );
      }
    }

    return updatedUser;
  }

  // Whether any account already uses this username, compared case-insensitively.
  // Lived on `AdminUsersService` until this feature; it is not admin-specific.
  async isUsernameTaken(username: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { name: { equals: username, mode: 'insensitive' } },
      select: { id: true },
    });
    return !!user;
  }

  // The providers linked to the signed-in user. Selects no password or OAuth token.
  async getMyAccounts(user: UserSession['user']): Promise<LinkedAccount[]> {
    this.logger.verbose(`Fetching the linked accounts of ${user.name}`);

    return this.prisma.account.findMany({
      where: { userId: user.id },
      select: { id: true, providerId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Unwraps the join rows and swaps both stored S3 keys — cover image and
   * author avatar — for signed URLs.
   *
   * The parameter is typed structurally because `Like` and `Bookmark` are
   * unrelated Prisma models despite selecting an identical blog.
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

  /**
   * Read from our `subscription` table, which the Stripe plugin's webhooks keep
   * in sync, so no request reaches Stripe. `referenceId` holds the user's id.
   */
  private async getSubscriptionState(
    userId: string,
  ): Promise<{ isPro: boolean; hasSubscribedBefore: boolean }> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        referenceId: userId,
        status: { notIn: ABANDONED_CHECKOUT_STATUSES },
      },
      select: { status: true },
    });

    return {
      isPro: subscriptions.some(({ status }) => PRO_STATUSES.includes(status)),
      hasSubscribedBefore: subscriptions.length > 0,
    };
  }
}
