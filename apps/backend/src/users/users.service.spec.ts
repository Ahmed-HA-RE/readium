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

type PrismaMocks = {
  user: { findUnique: jest.Mock<Promise<unknown>, [UserFindUniqueArgs]> };
  blog: { count: jest.Mock<Promise<number>, [BlogCountArgs]> };
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
});
