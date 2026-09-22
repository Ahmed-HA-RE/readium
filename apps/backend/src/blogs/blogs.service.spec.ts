import { Test, TestingModule } from '@nestjs/testing';
import { BlogsService } from './blogs.service';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { BlogQueryDto, BlogSortOptions } from './dto/blog-query-dto';
import { Prisma } from '../generated/prisma/client';

// The arguments the service hands to Prisma, so `mock.calls` stays typed and
// the assertions below are actually checked.
type BlogFindManyArgs = {
  where: Prisma.BlogWhereInput;
  orderBy: Prisma.BlogOrderByWithRelationInput[];
  take: number;
  skip: number;
  include: Record<string, unknown>;
};

type BlogCountArgs = { where: Prisma.BlogWhereInput };

// Typed so `mock.calls[0][0]` is `unknown` rather than `any`, which the
// `no-unsafe-member-access` rule rejects.
type PrismaMocks = {
  blog: {
    findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
    count: jest.Mock<Promise<number>, [unknown]>;
  };
};

const USER_ID = 'user-1';

// Every property of `BlogQueryDto` is required, so a partial query needs one
// cast rather than one per test.
const query = (partial: Partial<BlogQueryDto> = {}) => partial as BlogQueryDto;

const blogRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'blog-1',
  title: 'A blog',
  slug: 'a-blog',
  content: 'Body text',
  tags: ['nest'],
  coverImage: 'cover-key',
  isPublished: true,
  authorId: 'author-1',
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  author: { id: 'author-1', name: 'Ahmed', image: 'avatar-key' },
  likes: [],
  bookmarks: [],
  _count: { comments: 2, likes: 5, bookmarks: 1 },
  ...overrides,
});

describe('BlogsService', () => {
  let service: BlogsService;
  let prisma: PrismaMocks;
  let s3: { getSignedUrl: jest.Mock };

  const findManyArgs = () =>
    prisma.blog.findMany.mock.calls[0][0] as BlogFindManyArgs;
  const countArgs = () => prisma.blog.count.mock.calls[0][0] as BlogCountArgs;

  beforeEach(async () => {
    prisma = {
      blog: {
        findMany: jest
          .fn<Promise<unknown[]>, [unknown]>()
          .mockResolvedValue([]),
        count: jest.fn<Promise<number>, [unknown]>().mockResolvedValue(0),
      },
    };

    s3 = { getSignedUrl: jest.fn((key: string) => `signed:${key}`) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogsService,
        { provide: DatabaseService, useValue: prisma },
        { provide: S3ServiceService, useValue: s3 },
      ],
    }).compile();

    service = module.get<BlogsService>(BlogsService);
  });

  describe('getAllBlogs', () => {
    describe('reported blogs', () => {
      it('excludes blogs the caller has reported', async () => {
        await service.getAllBlogs(query(), USER_ID);

        expect(findManyArgs().where).toMatchObject({
          report: { none: { userId: USER_ID } },
        });
      });

      it('does not filter by report for anonymous callers', async () => {
        await service.getAllBlogs(query());

        expect(findManyArgs().where).not.toHaveProperty('report');
      });

      // The two queries must agree, or `totalPages` promises pages that render
      // empty once the reported rows are removed.
      it('applies the identical where clause to findMany and count', async () => {
        await service.getAllBlogs(query({ search: 'nest' }), USER_ID);

        expect(countArgs().where).toEqual(findManyArgs().where);
      });

      it('never returns unpublished blogs', async () => {
        await service.getAllBlogs(query(), USER_ID);

        expect(findManyArgs().where).toMatchObject({ isPublished: true });
      });
    });

    describe('pagination', () => {
      it('defaults to the first page of ten', async () => {
        await service.getAllBlogs(query());

        expect(findManyArgs()).toMatchObject({ take: 10, skip: 0 });
      });

      it('offsets by the page size', async () => {
        await service.getAllBlogs(query({ page: 3, limit: 5 }));

        expect(findManyArgs()).toMatchObject({ take: 5, skip: 10 });
      });

      it('rounds totalPages up so a partial page still counts', async () => {
        prisma.blog.count.mockResolvedValue(21);

        const result = await service.getAllBlogs(query({ limit: 10 }));

        expect(result.totalPages).toBe(3);
      });
    });

    describe('sorting', () => {
      // Every ordering ends on `id`, or rows with an equal key come back in a
      // different order each time and the feed reshuffles on a like.
      it.each([
        [BlogSortOptions.NEWEST, [{ createdAt: 'desc' }, { id: 'desc' }]],
        [BlogSortOptions.OLDEST, [{ createdAt: 'asc' }, { id: 'asc' }]],
        [
          BlogSortOptions.MOST_LIKED,
          [{ likes: { _count: 'desc' } }, { id: 'desc' }],
        ],
      ])('orders by %s, with a total order', async (sort, expected) => {
        await service.getAllBlogs(query({ sort }));

        expect(findManyArgs().orderBy).toEqual(expected);
      });

      it('falls back to newest first when no sort is given', async () => {
        await service.getAllBlogs(query());

        expect(findManyArgs().orderBy).toEqual([
          { createdAt: 'desc' },
          { id: 'desc' },
        ]);
      });
    });

    describe('search', () => {
      it('matches the term against title, content and author name', async () => {
        await service.getAllBlogs(query({ search: 'nest' }));

        expect(findManyArgs().where.OR).toEqual([
          { title: { contains: 'nest', mode: 'insensitive' } },
          { content: { contains: 'nest', mode: 'insensitive' } },
          { author: { name: { contains: 'nest', mode: 'insensitive' } } },
        ]);
      });

      it('adds no OR clause when the term is absent', async () => {
        await service.getAllBlogs(query());

        expect(findManyArgs().where).not.toHaveProperty('OR');
      });
    });

    describe('response shape', () => {
      it('signs the cover image and the author avatar', async () => {
        prisma.blog.findMany.mockResolvedValue([blogRow()]);

        const { blogs } = await service.getAllBlogs(query(), USER_ID);

        expect(blogs[0].coverImage).toBe('signed:cover-key');
        expect(blogs[0].author.image).toBe('signed:avatar-key');
      });

      it('leaves a missing cover image and avatar null without signing', async () => {
        prisma.blog.findMany.mockResolvedValue([
          blogRow({
            coverImage: null,
            author: { id: 'author-1', name: 'Ahmed', image: null },
          }),
        ]);

        const { blogs } = await service.getAllBlogs(query(), USER_ID);

        expect(blogs[0].coverImage).toBeNull();
        expect(blogs[0].author.image).toBeNull();
        expect(s3.getSignedUrl).not.toHaveBeenCalled();
      });

      it('reports the caller liked and bookmarked state', async () => {
        prisma.blog.findMany.mockResolvedValue([
          blogRow({ likes: [{ userId: USER_ID }], bookmarks: [] }),
        ]);

        const { blogs } = await service.getAllBlogs(query(), USER_ID);

        expect(blogs[0].isLikedByLoggedInUser).toBe(true);
        expect(blogs[0].isBookmarkedByLoggedInUser).toBe(false);
      });

      it('reports both flags false for anonymous callers', async () => {
        prisma.blog.findMany.mockResolvedValue([
          blogRow({ likes: undefined, bookmarks: undefined }),
        ]);

        const { blogs } = await service.getAllBlogs(query());

        expect(blogs[0].isLikedByLoggedInUser).toBe(false);
        expect(blogs[0].isBookmarkedByLoggedInUser).toBe(false);
      });

      // These only exist to derive the flags above; leaking them would tell a
      // caller who else liked or bookmarked the blog.
      it('strips the likes and bookmarks relations from the payload', async () => {
        prisma.blog.findMany.mockResolvedValue([
          blogRow({ likes: [{ userId: USER_ID }], bookmarks: [] }),
        ]);

        const { blogs } = await service.getAllBlogs(query(), USER_ID);

        expect(blogs[0]).not.toHaveProperty('likes');
        expect(blogs[0]).not.toHaveProperty('bookmarks');
      });

      it('keeps the comment, like and bookmark counts', async () => {
        prisma.blog.findMany.mockResolvedValue([blogRow()]);

        const { blogs } = await service.getAllBlogs(query(), USER_ID);

        expect(blogs[0]._count).toEqual({
          comments: 2,
          likes: 5,
          bookmarks: 1,
        });
      });
    });
  });

  describe('getTrendingBlogs', () => {
    // `orderBy` is an array here, unlike `getAllBlogs`, so it needs its own type.
    type TrendingFindManyArgs = {
      where: Prisma.BlogWhereInput;
      orderBy: Prisma.BlogOrderByWithRelationInput[];
      take: number;
      select: Record<string, unknown>;
    };

    const trendingArgs = () =>
      prisma.blog.findMany.mock.calls[0][0] as TrendingFindManyArgs;

    const trendingRow = (image: string | null = 'avatar-key') => ({
      title: 'A blog',
      slug: 'a-blog',
      content: 'Body text',
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      author: { name: 'Ahmed', image },
    });

    describe('query', () => {
      it('never returns unpublished blogs', async () => {
        await service.getTrendingBlogs(USER_ID);

        expect(trendingArgs().where).toMatchObject({ isPublished: true });
      });

      // Regression: `orderBy` sorts but does not filter, so without this a
      // zero-like blog fills a slot and the panel degrades into "5 newest".
      it('returns only blogs that have at least one like', async () => {
        await service.getTrendingBlogs(USER_ID);

        expect(trendingArgs().where).toMatchObject({ likes: { some: {} } });
      });

      it('takes five', async () => {
        await service.getTrendingBlogs(USER_ID);

        expect(trendingArgs().take).toBe(5);
      });

      // Same rule as the feed and the search suggestions.
      it('never returns a blog the caller has reported', async () => {
        await service.getTrendingBlogs(USER_ID);

        expect(trendingArgs().where).toMatchObject({
          report: { none: { userId: USER_ID } },
        });
      });

      it('does not filter by report for anonymous callers', async () => {
        await service.getTrendingBlogs();

        expect(trendingArgs().where).not.toHaveProperty('report');
      });

      it('orders by like count, breaking ties on the newer blog', async () => {
        await service.getTrendingBlogs(USER_ID);

        expect(trendingArgs().orderBy).toEqual([
          { likes: { _count: 'desc' } },
          { createdAt: 'desc' },
        ]);
      });

      // Deliberate divergence from the spec, which asked for them to be
      // excluded. The list is identical for every caller.
      it('includes the caller’s own blogs', async () => {
        await service.getTrendingBlogs(USER_ID);

        expect(trendingArgs().where).not.toHaveProperty('authorId');
      });

      it('does not select the cover image', async () => {
        await service.getTrendingBlogs(USER_ID);

        expect(trendingArgs().select).not.toHaveProperty('coverImage');
      });
    });

    describe('author avatar', () => {
      it('signs a stored S3 key', async () => {
        prisma.blog.findMany.mockResolvedValue([trendingRow()]);

        const blogs = await service.getTrendingBlogs(USER_ID);

        expect(blogs[0].author.image).toBe('signed:avatar-key');
      });

      // OAuth sign-ups store the provider URL in `User.image`. Signing one
      // would treat it as an object key and 403 on every read.
      it.each([
        'https://lh3.googleusercontent.com/a/photo.jpg',
        'http://avatars.githubusercontent.com/u/1',
      ])('returns the external URL %s unsigned', async (url) => {
        prisma.blog.findMany.mockResolvedValue([trendingRow(url)]);

        const blogs = await service.getTrendingBlogs(USER_ID);

        expect(blogs[0].author.image).toBe(url);
        expect(s3.getSignedUrl).not.toHaveBeenCalled();
      });

      it('leaves a missing avatar null without signing', async () => {
        prisma.blog.findMany.mockResolvedValue([trendingRow(null)]);

        const blogs = await service.getTrendingBlogs(USER_ID);

        expect(blogs[0].author.image).toBeNull();
        expect(s3.getSignedUrl).not.toHaveBeenCalled();
      });
    });

    it('returns an empty list when nothing is liked', async () => {
      prisma.blog.findMany.mockResolvedValue([]);

      await expect(service.getTrendingBlogs(USER_ID)).resolves.toEqual([]);
    });
  });
});
