import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { BlogQueryDto, BlogSortOptions } from '../blogs/dto/blog-query-dto';
import { UserBlogsQueryDto } from './dto/user-blogs-query-dto';
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

type PrismaMocks = {
  user: { findUnique: jest.Mock<Promise<unknown>, [UserFindUniqueArgs]> };
  blog: {
    count: jest.Mock<Promise<number>, [BlogCountArgs]>;
    findMany: jest.Mock<Promise<unknown[]>, [BlogFindManyArgs]>;
  };
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
    prisma = {
      user: { findUnique: jest.fn<Promise<unknown>, [UserFindUniqueArgs]>() },
      blog: {
        count: jest.fn<Promise<number>, [BlogCountArgs]>().mockResolvedValue(1),
        findMany: jest
          .fn<Promise<unknown[]>, [BlogFindManyArgs]>()
          .mockResolvedValue([myBlogRow]),
      },
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
});
