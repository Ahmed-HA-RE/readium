import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { BlogQueryDto, BlogSortOptions } from '../blogs/dto/blog-query-dto';
import { UserBlogsQueryDto } from './dto/user-blogs-query-dto';
import { CommentQueryDto } from '../comments/dto/comment-query-dto';
import { LikesAndBookmarksQueryDto } from './dto/likes-and-bookmarks-query-dto';
import { Prisma } from '../generated/prisma/client';

// The arguments the service hands to Prisma. The mocks below are typed with
// these so `mock.calls` is not an `any[]` and the assertions stay checked.
type UserFindUniqueArgs = {
  where: { name: string };
  select: Record<string, unknown> & {
    blogs: {
      where: Prisma.BlogWhereInput;
      orderBy: Prisma.BlogOrderByWithRelationInput;
      skip: number;
      take: number;
      select: Record<string, unknown> & {
        _count: { select: Record<string, boolean> };
      };
    };
  };
};

type BlogCountArgs = { where: Prisma.BlogWhereInput };

type BlogFindManyArgs = {
  where: Prisma.BlogWhereInput;
  orderBy: Prisma.BlogOrderByWithRelationInput;
  skip: number;
  take: number;
  select: Record<string, unknown> & {
    _count: { select: Record<string, boolean> };
  };
};

type CommentFindManyArgs = {
  where: Prisma.CommentWhereInput;
  take: number;
  skip?: number;
  cursor?: { id: string };
  orderBy: Prisma.CommentOrderByWithRelationInput[];
  select: Record<string, boolean>;
};

// Likes and bookmarks run the identical query against two different tables, so
// one pair of mock types covers both.
type LikesAndBookmarksFindManyArgs = {
  where: { userId: string; blog: { isPublished: boolean } };
  orderBy: Prisma.LikeOrderByWithRelationInput[];
  skip: number;
  take: number;
  select: { blog: { select: Record<string, unknown> } };
};

type LikesAndBookmarksCountArgs = {
  where: { userId: string; blog: { isPublished: boolean } };
};

type LikesAndBookmarksMocks = {
  findMany: jest.Mock<Promise<unknown[]>, [LikesAndBookmarksFindManyArgs]>;
  count: jest.Mock<Promise<number>, [LikesAndBookmarksCountArgs]>;
};

type PrismaMocks = {
  user: { findUnique: jest.Mock<Promise<unknown>, [UserFindUniqueArgs]> };
  blog: {
    count: jest.Mock<Promise<number>, [BlogCountArgs]>;
    findMany: jest.Mock<Promise<unknown[]>, [BlogFindManyArgs]>;
  };
  comment: {
    findMany: jest.Mock<Promise<unknown[]>, [CommentFindManyArgs]>;
  };
  like: LikesAndBookmarksMocks;
  bookmark: LikesAndBookmarksMocks;
};

// Every property of BlogQueryDto is required, so a partial query needs one
// cast here rather than one per test.
const query = (partial: Partial<BlogQueryDto> = {}) =>
  partial as UserBlogsQueryDto;

const blogRow = {
  id: 'blog-1',
  title: 'A published blog',
  slug: 'a-published-blog',
  content: 'content',
  tags: ['nest'],
  coverImage: 'cover-key',
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  _count: { comments: 2, likes: 5, bookmarks: 1 },
};

const userRow = {
  name: 'Ahmed',
  bio: 'Writes about backends',
  website: 'https://example.com',
  image: 'profile-key',
  banned: false,
  blogs: [blogRow],
};

// The owner's own view carries `isPublished`, because drafts are listed too.
const myBlogRow = { ...blogRow, isPublished: false };

const commentRow = {
  id: 'comment-1',
  content: 'Great write-up',
  createdAt: new Date('2026-09-02T00:00:00.000Z'),
};

// A like or bookmark row as its query returns it: the join row is projected
// away and only the blog is selected.
const likeOrBookmarkRow = {
  blog: {
    id: 'blog-1',
    title: 'A published blog',
    slug: 'a-published-blog',
    tags: ['nest'],
    coverImage: 'cover-key',
    author: { name: 'Sara', image: 'author-key' },
  },
};

// A session as the AuthGuard hands it over. Only the fields the service reads
// matter, so this is cast rather than reproducing better-auth's full type.
const session = (overrides: Record<string, unknown> = {}) =>
  ({
    session: {
      id: 'session-1',
      token: 'session-token',
      userId: 'user-1',
      expiresAt: new Date('2026-10-01T00:00:00.000Z'),
    },
    user: {
      id: 'user-1',
      name: 'Ahmed',
      email: 'ahmed@example.com',
      emailVerified: true,
      image: 'profile-key',
      role: 'user',
      ...overrides,
    },
  }) as unknown as Parameters<UsersService['getCurrentLoggedInUser']>[0];

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaMocks;
  let s3: { getSignedUrl: jest.Mock };

  const findUniqueArgs = () => prisma.user.findUnique.mock.calls[0][0];

  const countArgs = () => prisma.blog.count.mock.calls[0][0];

  beforeEach(async () => {
    const likesAndBookmarksMocks = (): LikesAndBookmarksMocks => ({
      findMany: jest
        .fn<Promise<unknown[]>, [LikesAndBookmarksFindManyArgs]>()
        .mockResolvedValue([likeOrBookmarkRow]),
      count: jest
        .fn<Promise<number>, [LikesAndBookmarksCountArgs]>()
        .mockResolvedValue(1),
    });

    prisma = {
      user: { findUnique: jest.fn<Promise<unknown>, [UserFindUniqueArgs]>() },
      blog: {
        count: jest.fn<Promise<number>, [BlogCountArgs]>().mockResolvedValue(1),
        findMany: jest
          .fn<Promise<unknown[]>, [BlogFindManyArgs]>()
          .mockResolvedValue([myBlogRow]),
      },
      comment: {
        findMany: jest
          .fn<Promise<unknown[]>, [CommentFindManyArgs]>()
          .mockResolvedValue([commentRow]),
      },
      like: likesAndBookmarksMocks(),
      bookmark: likesAndBookmarksMocks(),
    };
    s3 = { getSignedUrl: jest.fn().mockResolvedValue('https://signed/url') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: prisma },
        { provide: S3ServiceService, useValue: s3 },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getUserProfileWithBlogs', () => {
    it('returns only published blogs', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserProfileWithBlogs('Ahmed', query());

      const { where, select } = findUniqueArgs();
      expect(where).toEqual({ name: 'Ahmed' });
      expect(select.blogs.where.isPublished).toBe(true);
      expect(countArgs().where.isPublished).toBe(true);
    });

    it('counts only the blogs of the requested author', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserProfileWithBlogs('Ahmed', query());

      expect(countArgs().where.author).toEqual({ name: 'Ahmed' });
    });

    it('searches the title and the content only, never the author', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserProfileWithBlogs('Ahmed', query({ search: 'nest' }));

      expect(findUniqueArgs().select.blogs.where.OR).toEqual([
        { title: { contains: 'nest', mode: 'insensitive' } },
        { content: { contains: 'nest', mode: 'insensitive' } },
      ]);
    });

    it('applies no search filter when no search term is given', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserProfileWithBlogs('Ahmed', query());

      expect(findUniqueArgs().select.blogs.where).toEqual({
        isPublished: true,
      });
    });

    it('does not select the comment list, only its count', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserProfileWithBlogs('Ahmed', query());

      const blogsSelect = findUniqueArgs().select.blogs.select;
      expect(blogsSelect.comments).toBeUndefined();
      expect(blogsSelect._count.select.comments).toBe(true);
    });

    it('never selects email or any moderation column beyond banned', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserProfileWithBlogs('Ahmed', query());

      const { select } = findUniqueArgs();
      expect(select.email).toBeUndefined();
      expect(select.role).toBeUndefined();
      expect(select.banReason).toBeUndefined();
    });

    it('strips banned from the returned profile', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      const result = await service.getUserProfileWithBlogs('Ahmed', query());

      expect(result.user).toEqual({
        name: 'Ahmed',
        bio: 'Writes about backends',
        website: 'https://example.com',
        image: 'https://signed/url',
      });
      expect('banned' in result.user).toBe(false);
    });

    it('reuses the sort, limit and page values from buildBlogQuery', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserProfileWithBlogs(
        'Ahmed',
        query({ sort: BlogSortOptions.OLDEST, page: '3', limit: '5' }),
      );

      const { blogs } = findUniqueArgs().select;
      expect(blogs.orderBy).toEqual({ createdAt: 'asc' });
      expect(blogs.take).toBe(5);
      expect(blogs.skip).toBe(10);
    });

    it('defaults to the newest 10 blogs on the first page', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserProfileWithBlogs('Ahmed', query());

      const { blogs } = findUniqueArgs().select;
      expect(blogs.orderBy).toEqual({ createdAt: 'desc' });
      expect(blogs.take).toBe(10);
      expect(blogs.skip).toBe(0);
    });

    it('sorts by like count for the most_liked option', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserProfileWithBlogs(
        'Ahmed',
        query({ sort: BlogSortOptions.MOST_LIKED }),
      );

      expect(findUniqueArgs().select.blogs.orderBy).toEqual({
        likes: { _count: 'desc' },
      });
    });

    it('derives totalPages from the published blog count', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });
      prisma.blog.count.mockResolvedValue(21);

      const result = await service.getUserProfileWithBlogs(
        'Ahmed',
        query({ limit: '5' }),
      );

      expect(result.totalPages).toBe(5);
    });

    it('signs the avatar and every cover image', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      const result = await service.getUserProfileWithBlogs('Ahmed', query());

      expect(s3.getSignedUrl).toHaveBeenCalledWith('profile-key');
      expect(s3.getSignedUrl).toHaveBeenCalledWith('cover-key');
      expect(result.blogs[0].coverImage).toBe('https://signed/url');
    });

    it('leaves a missing avatar or cover image as null', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...userRow,
        image: null,
        blogs: [{ ...blogRow, coverImage: null }],
      });

      const result = await service.getUserProfileWithBlogs('Ahmed', query());

      expect(s3.getSignedUrl).not.toHaveBeenCalled();
      expect(result.user.image).toBeNull();
      expect(result.blogs[0].coverImage).toBeNull();
    });

    it('throws NotFoundException for an unknown username', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getUserProfileWithBlogs('nobody', query()),
      ).rejects.toThrow(NotFoundException);
    });

    // A banned account must be indistinguishable from one that never existed.
    it('throws NotFoundException for a banned user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow, banned: true });

      await expect(
        service.getUserProfileWithBlogs('Ahmed', query()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCurrentLoggedInUser', () => {
    it('returns the session object untouched', async () => {
      const input = session();

      const result = await service.getCurrentLoggedInUser(input);

      expect(result.session).toEqual(input.session);
    });

    // The guard has already resolved the session, so there is nothing to look
    // up. A query here would be a second read of data we were handed.
    it('does not query the database', async () => {
      await service.getCurrentLoggedInUser(session());

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.blog.findMany).not.toHaveBeenCalled();
    });

    it('returns the session user with every field it carried', async () => {
      const result = await service.getCurrentLoggedInUser(session());

      expect(result.user).toEqual({
        id: 'user-1',
        name: 'Ahmed',
        email: 'ahmed@example.com',
        emailVerified: true,
        image: 'https://signed/url',
        role: 'user',
        isPro: true,
      });
    });

    // Hardcoded until subscriptions land. This test is the reminder to update
    // it when they do.
    it('reports isPro as true for every user', async () => {
      const result = await service.getCurrentLoggedInUser(session());

      expect(result.user.isPro).toBe(true);
    });

    it('signs the avatar so the sidebar can render it', async () => {
      const result = await service.getCurrentLoggedInUser(session());

      expect(s3.getSignedUrl).toHaveBeenCalledWith('profile-key');
      expect(result.user.image).toBe('https://signed/url');
    });

    it('leaves a missing avatar as null', async () => {
      const result = await service.getCurrentLoggedInUser(
        session({ image: null }),
      );

      expect(s3.getSignedUrl).not.toHaveBeenCalled();
      expect(result.user.image).toBeNull();
    });
  });

  describe('getMyBlogs', () => {
    const findManyArgs = () => prisma.blog.findMany.mock.calls[0][0];

    const myBlogs = (partial: Partial<BlogQueryDto> = {}) =>
      service.getMyBlogs(session().user, query(partial));

    // The whole point of the endpoint: the author comes from the session, so
    // no caller-supplied identifier can widen the result set.
    it('scopes the blogs to the session user id', async () => {
      await myBlogs();

      expect(findManyArgs().where.authorId).toBe('user-1');
    });

    it('scopes the count to the same author', async () => {
      await myBlogs();

      expect(countArgs().where.authorId).toBe('user-1');
    });

    it('counts with exactly the filter it queried with', async () => {
      await myBlogs({ search: 'nest' });

      expect(countArgs().where).toEqual(findManyArgs().where);
    });

    // Unlike the public profile: these are the owner's own blogs, so drafts
    // belong in the list.
    it('includes drafts', async () => {
      await myBlogs();

      expect(findManyArgs().where.isPublished).toBeUndefined();
    });

    it('returns isPublished so the UI can flag drafts', async () => {
      const result = await myBlogs();

      expect(findManyArgs().select.isPublished).toBe(true);
      expect(result.blogs[0].isPublished).toBe(false);
    });

    // buildBlogQuery's own filter also matches author.name, which would return
    // every blog whenever the search term matched the caller's username.
    it('searches the title and the content only, never the author', async () => {
      await myBlogs({ search: 'nest' });

      expect(findManyArgs().where.OR).toEqual([
        { title: { contains: 'nest', mode: 'insensitive' } },
        { content: { contains: 'nest', mode: 'insensitive' } },
      ]);
    });

    it('applies no search filter when no search term is given', async () => {
      await myBlogs();

      expect(findManyArgs().where).toEqual({ authorId: 'user-1' });
    });

    it('reuses the sort, limit and page values from buildBlogQuery', async () => {
      await myBlogs({ sort: BlogSortOptions.OLDEST, page: '3', limit: '5' });

      const args = findManyArgs();
      expect(args.orderBy).toEqual({ createdAt: 'asc' });
      expect(args.take).toBe(5);
      expect(args.skip).toBe(10);
    });

    it('defaults to the newest 10 blogs on the first page', async () => {
      await myBlogs();

      const args = findManyArgs();
      expect(args.orderBy).toEqual({ createdAt: 'desc' });
      expect(args.take).toBe(10);
      expect(args.skip).toBe(0);
    });

    it('sorts by like count for the most_liked option', async () => {
      await myBlogs({ sort: BlogSortOptions.MOST_LIKED });

      expect(findManyArgs().orderBy).toEqual({ likes: { _count: 'desc' } });
    });

    it('does not select the comment list, only its count', async () => {
      await myBlogs();

      const select = findManyArgs().select;
      expect(select.comments).toBeUndefined();
      expect(select._count.select.comments).toBe(true);
    });

    it('derives totalPages from the scoped blog count', async () => {
      prisma.blog.count.mockResolvedValue(21);

      const result = await myBlogs({ limit: '5' });

      expect(result.totalPages).toBe(5);
    });

    it('signs every cover image', async () => {
      const result = await myBlogs();

      expect(s3.getSignedUrl).toHaveBeenCalledWith('cover-key');
      expect(result.blogs[0].coverImage).toBe('https://signed/url');
    });

    it('leaves a missing cover image as null', async () => {
      prisma.blog.findMany.mockResolvedValue([
        { ...myBlogRow, coverImage: null },
      ]);

      const result = await myBlogs();

      expect(s3.getSignedUrl).not.toHaveBeenCalled();
      expect(result.blogs[0].coverImage).toBeNull();
    });
  });

  describe('getMyComments', () => {
    const findManyArgs = () => prisma.comment.findMany.mock.calls[0][0];

    const myComments = (partial: Partial<CommentQueryDto> = {}) =>
      service.getMyComments(session().user, partial as CommentQueryDto);

    // The whole point of the endpoint: the author comes from the session, so
    // no caller-supplied identifier can widen the result set.
    it('scopes the comments to the session user id', async () => {
      await myComments();

      expect(findManyArgs().where).toEqual({ authorId: 'user-1' });
    });

    // History #2: ordering by createdAt alone leaves a cursor on `id` sitting
    // at an ambiguous position, so tied rows skip or repeat across pages.
    it('breaks ties on id so the cursor ordering is total', async () => {
      await myComments();

      expect(findManyArgs().orderBy).toEqual([
        { createdAt: 'desc' },
        { id: 'desc' },
      ]);
    });

    it('defaults to the newest 10 comments and no cursor', async () => {
      await myComments();

      const args = findManyArgs();
      expect(args.take).toBe(10);
      expect(args.cursor).toBeUndefined();
      expect(args.skip).toBeUndefined();
    });

    it('honours the limit', async () => {
      await myComments({ limit: 25 });

      expect(findManyArgs().take).toBe(25);
    });

    // skip: 1 steps over the cursor row, which the client already has as the
    // last row of the previous page.
    it('steps over the cursor row when a cursor is given', async () => {
      await myComments({ cursor: 'comment-9' });

      const args = findManyArgs();
      expect(args.cursor).toEqual({ id: 'comment-9' });
      expect(args.skip).toBe(1);
    });

    it('returns the last id as nextCursor when the page is full', async () => {
      prisma.comment.findMany.mockResolvedValue([
        commentRow,
        { ...commentRow, id: 'comment-2' },
      ]);

      const result = await myComments({ limit: 2 });

      expect(result.nextCursor).toBe('comment-2');
    });

    // A short page is the last page. Returning its last id would cost the
    // client a round trip to discover the feed had already ended.
    it('returns a null nextCursor when the page is short', async () => {
      const result = await myComments({ limit: 2 });

      expect(result.data).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });

    it('returns a null nextCursor when there are no comments at all', async () => {
      prisma.comment.findMany.mockResolvedValue([]);

      const result = await myComments();

      expect(result.data).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });

    it('returns only the content, createdAt and id of each comment', async () => {
      const result = await myComments();

      expect(findManyArgs().select).toEqual({
        id: true,
        content: true,
        createdAt: true,
      });
      expect(Object.keys(result.data[0]).sort()).toEqual([
        'author',
        'content',
        'createdAt',
        'id',
      ]);
    });

    it('attaches the session user name and signed avatar to each comment', async () => {
      prisma.comment.findMany.mockResolvedValue([
        commentRow,
        { ...commentRow, id: 'comment-2' },
      ]);

      const result = await myComments();

      expect(result.data[0].author).toEqual({
        name: 'Ahmed',
        image: 'https://signed/url',
      });
      expect(result.data[1].author).toEqual(result.data[0].author);
    });

    // Every row has the same author, so signing per row would be N identical
    // round trips to S3.
    it('signs the avatar once, not once per comment', async () => {
      prisma.comment.findMany.mockResolvedValue([
        commentRow,
        { ...commentRow, id: 'comment-2' },
        { ...commentRow, id: 'comment-3' },
      ]);

      await myComments();

      expect(s3.getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('leaves a missing avatar as null', async () => {
      const result = await service.getMyComments(
        session({ image: null }).user,
        {} as CommentQueryDto,
      );

      expect(s3.getSignedUrl).not.toHaveBeenCalled();
      expect(result.data[0].author.image).toBeNull();
    });

    it('never selects the author relation, since the session already has it', async () => {
      await myComments();

      expect(findManyArgs().select.author).toBeUndefined();
    });
  });

  // The two tabs are the same query against two different join tables, so the
  // whole block runs twice rather than being written out twice.
  describe.each([
    ['getMyLikes', 'like'],
    ['getMyBookmarks', 'bookmark'],
  ] as const)('%s', (method, model) => {
    const findManyArgs = () => prisma[model].findMany.mock.calls[0][0];

    const countArgs = () => prisma[model].count.mock.calls[0][0];

    const saved = (partial: Partial<LikesAndBookmarksQueryDto> = {}) =>
      service[method](session().user, partial as LikesAndBookmarksQueryDto);

    it('scopes the rows to the session user id', async () => {
      await saved();

      expect(findManyArgs().where.userId).toBe('user-1');
    });

    it('counts with exactly the filter it queried with', async () => {
      await saved();

      expect(countArgs().where).toEqual(findManyArgs().where);
    });

    // A blog unpublished after it was liked or bookmarked would otherwise
    // render a card linking to a dead page.
    it('excludes blogs that are no longer published', async () => {
      await saved();

      expect(findManyArgs().where.blog).toEqual({ isPublished: true });
    });

    // The sort key is when the user saved it, not when the blog was written.
    it('orders by when the row was created, with an id tie-break', async () => {
      await saved();

      expect(findManyArgs().orderBy).toEqual([
        { createdAt: 'desc' },
        { id: 'desc' },
      ]);
    });

    it('defaults to the first page of 10', async () => {
      await saved();

      const args = findManyArgs();
      expect(args.take).toBe(10);
      expect(args.skip).toBe(0);
    });

    it('applies the page and limit', async () => {
      await saved({ page: 3, limit: 5 });

      const args = findManyArgs();
      expect(args.take).toBe(5);
      expect(args.skip).toBe(10);
    });

    it('derives totalPages from the scoped row count', async () => {
      prisma[model].count.mockResolvedValue(21);

      const result = await saved({ limit: 5 });

      expect(result.totalPages).toBe(5);
    });

    // "Do not return unnecessary like or bookmark record data": the join row
    // is projected away entirely and only the blog is selected.
    it('returns blog data only, never the join row', async () => {
      const result = await saved();

      expect(Object.keys(findManyArgs().select)).toEqual(['blog']);
      expect(Object.keys(result.blogs[0]).sort()).toEqual([
        'author',
        'coverImage',
        'id',
        'slug',
        'tags',
        'title',
      ]);
    });

    it('selects the slug the card navigates by', async () => {
      const result = await saved();

      expect(findManyArgs().select.blog.select).toMatchObject({ slug: true });
      expect(result.blogs[0].slug).toBe('a-published-blog');
    });

    it('signs both the cover image and the author avatar', async () => {
      const result = await saved();

      expect(s3.getSignedUrl).toHaveBeenCalledWith('cover-key');
      expect(s3.getSignedUrl).toHaveBeenCalledWith('author-key');
      expect(result.blogs[0].coverImage).toBe('https://signed/url');
      expect(result.blogs[0].author.image).toBe('https://signed/url');
    });

    it('leaves a missing cover image or avatar as null', async () => {
      prisma[model].findMany.mockResolvedValue([
        {
          blog: {
            ...likeOrBookmarkRow.blog,
            coverImage: null,
            author: { name: 'Sara', image: null },
          },
        },
      ]);

      const result = await saved();

      expect(s3.getSignedUrl).not.toHaveBeenCalled();
      expect(result.blogs[0].coverImage).toBeNull();
      expect(result.blogs[0].author.image).toBeNull();
    });
  });
});
