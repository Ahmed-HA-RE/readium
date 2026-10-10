import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BlogsService } from './blogs.service';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { BlogQueryDto, BlogSortOptions } from './dto/blog-query-dto';
import { CreateBlogDto } from './dto/create-blog-dto';
import { UpdateBlogDto } from './dto/update-blog-dto';
import { Prisma } from '../generated/prisma/client';
import { PRO_STATUSES } from '../../lib/constants';

// The arguments the service hands to Prisma, so `mock.calls` stays typed and
// the assertions below are actually checked.
type BlogFindManyArgs = {
  where: Prisma.BlogWhereInput;
  orderBy: Prisma.BlogOrderByWithRelationInput[];
  take: number;
  skip: number;
  omit: Record<string, boolean>;
  include: Record<string, unknown>;
};

type BlogCountArgs = { where: Prisma.BlogWhereInput };

type BlogFindUniqueArgs = {
  where: Prisma.BlogWhereInput;
  include: Record<string, unknown>;
};

// Typed so `mock.calls[0][0]` is `unknown` rather than `any`, which the
// `no-unsafe-member-access` rule rejects.
type PrismaMocks = {
  blog: {
    findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
    findUnique: jest.Mock<Promise<unknown>, [unknown]>;
    count: jest.Mock<Promise<number>, [unknown]>;
    create: jest.Mock<Promise<unknown>, [unknown]>;
    update: jest.Mock<Promise<unknown>, [unknown]>;
  };
  subscription: {
    count: jest.Mock<Promise<number>, [unknown]>;
  };
};

const USER_ID = 'user-1';
const VIEWER = { id: USER_ID, role: 'user' };

// Every property of `BlogQueryDto` is required, so a partial query needs one
// cast rather than one per test.
const query = (partial: Partial<BlogQueryDto> = {}) => partial as BlogQueryDto;

const blogRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'blog-1',
  title: 'A blog',
  slug: 'a-blog',
  shortDescription: 'A short preview',
  content: '<p>Body text</p>',
  tags: ['nest'],
  coverImage: 'cover-key',
  isPublished: true,
  blogPro: false,
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
  const findUniqueArgs = () =>
    prisma.blog.findUnique.mock.calls[0][0] as BlogFindUniqueArgs;

  beforeEach(async () => {
    prisma = {
      blog: {
        findMany: jest
          .fn<Promise<unknown[]>, [unknown]>()
          .mockResolvedValue([]),
        findUnique: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue(null),
        count: jest.fn<Promise<number>, [unknown]>().mockResolvedValue(0),
        create: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue(blogRow()),
        update: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue(blogRow()),
      },
      subscription: {
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
        [BlogSortOptions.MOST_LIKED, [{ likesCount: 'desc' }, { id: 'desc' }]],
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
      // Cards render `shortDescription`, so shipping every full body in a list
      // is pure payload.
      it('omits the full content from the query', async () => {
        await service.getAllBlogs(query());

        expect(findManyArgs().omit).toEqual({ content: true });
      });

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

  describe('getBlogBySlug', () => {
    describe('query', () => {
      // A signed-in caller also matches their own drafts, so the author can
      // open and edit one; no one else can.
      it('looks the blog up by slug, published or the caller’s own', async () => {
        prisma.blog.findUnique.mockResolvedValue(blogRow());

        await service.getBlogBySlug('a-blog', VIEWER);

        expect(findUniqueArgs().where).toMatchObject({
          slug: 'a-blog',
          OR: [{ isPublished: true }, { authorId: USER_ID }],
        });
      });

      it('matches published blogs only for an anonymous caller', async () => {
        prisma.blog.findUnique.mockResolvedValue(blogRow());

        await service.getBlogBySlug('a-blog');

        expect(findUniqueArgs().where).toMatchObject({
          slug: 'a-blog',
          OR: [{ isPublished: true }],
        });
      });

      // Same rule as the feed, trending and search: a pending report must not
      // pull the blog from anyone but the reporter.
      it('hides a blog the caller has reported', async () => {
        prisma.blog.findUnique.mockResolvedValue(blogRow());

        await service.getBlogBySlug('a-blog', VIEWER);

        expect(findUniqueArgs().where).toMatchObject({
          report: { none: { userId: USER_ID } },
        });
      });

      it('does not filter by report for anonymous callers', async () => {
        prisma.blog.findUnique.mockResolvedValue(blogRow());

        await service.getBlogBySlug('a-blog');

        expect(findUniqueArgs().where).not.toHaveProperty('report');
      });

      it('selects the author avatar alongside the id and name', async () => {
        prisma.blog.findUnique.mockResolvedValue(blogRow());

        await service.getBlogBySlug('a-blog');

        expect(findUniqueArgs().include.author).toEqual({
          select: { id: true, name: true, image: true },
        });
      });

      it('only loads the like and bookmark relations for a signed-in caller', async () => {
        prisma.blog.findUnique.mockResolvedValue(blogRow());

        await service.getBlogBySlug('a-blog');

        expect(findUniqueArgs().include).not.toHaveProperty('likes');
        expect(findUniqueArgs().include).not.toHaveProperty('bookmarks');
      });
    });

    it('throws NotFoundException when no blog matches', async () => {
      prisma.blog.findUnique.mockResolvedValue(null);

      await expect(
        service.getBlogBySlug('missing', VIEWER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    describe('response shape', () => {
      it('signs the cover image and an S3 author avatar', async () => {
        prisma.blog.findUnique.mockResolvedValue(blogRow());

        const { blog } = await service.getBlogBySlug('a-blog', VIEWER);

        expect(blog.coverImage).toBe('signed:cover-key');
        expect(blog.author.image).toBe('signed:avatar-key');
      });

      // OAuth sign-ups store the provider URL, which must not be signed.
      it('returns an external avatar URL unsigned', async () => {
        const url = 'https://lh3.googleusercontent.com/a/photo.jpg';
        prisma.blog.findUnique.mockResolvedValue(
          blogRow({
            coverImage: null,
            author: { id: 'author-1', name: 'Ahmed', image: url },
          }),
        );

        const { blog } = await service.getBlogBySlug('a-blog', VIEWER);

        expect(blog.author.image).toBe(url);
        expect(s3.getSignedUrl).not.toHaveBeenCalled();
      });

      it('leaves a missing cover image and avatar null', async () => {
        prisma.blog.findUnique.mockResolvedValue(
          blogRow({
            coverImage: null,
            author: { id: 'author-1', name: 'Ahmed', image: null },
          }),
        );

        const { blog } = await service.getBlogBySlug('a-blog', VIEWER);

        expect(blog.coverImage).toBeNull();
        expect(blog.author.image).toBeNull();
        expect(s3.getSignedUrl).not.toHaveBeenCalled();
      });

      it('reports the caller liked and bookmarked state', async () => {
        prisma.blog.findUnique.mockResolvedValue(
          blogRow({ likes: [{ userId: USER_ID }], bookmarks: [] }),
        );

        const result = await service.getBlogBySlug('a-blog', VIEWER);

        expect(result.isLikedByLoggedInUser).toBe(true);
        expect(result.isBookmarkedByLoggedInUser).toBe(false);
      });

      it('reports both flags false for anonymous callers', async () => {
        prisma.blog.findUnique.mockResolvedValue(
          blogRow({ likes: undefined, bookmarks: undefined }),
        );

        const result = await service.getBlogBySlug('a-blog');

        expect(result.isLikedByLoggedInUser).toBe(false);
        expect(result.isBookmarkedByLoggedInUser).toBe(false);
      });

      it('strips the likes and bookmarks relations and keeps the body', async () => {
        prisma.blog.findUnique.mockResolvedValue(
          blogRow({ likes: [{ userId: USER_ID }], bookmarks: [] }),
        );

        const { blog } = await service.getBlogBySlug('a-blog', VIEWER);

        expect(blog).not.toHaveProperty('likes');
        expect(blog).not.toHaveProperty('bookmarks');
        expect(blog.content).toBe('<p>Body text</p>');
        expect(blog.shortDescription).toBe('A short preview');
      });
    });

    describe('pro content', () => {
      const proContent = '<p>one two three four</p><p>five six seven eight</p>';
      const firstHalf = '<p>one two three four</p>';
      const proBlog = () => blogRow({ blogPro: true, content: proContent });

      it('returns a public blog in full without a subscription lookup', async () => {
        prisma.blog.findUnique.mockResolvedValue(
          blogRow({ content: proContent }),
        );

        const result = await service.getBlogBySlug('a-blog');

        expect(result.blog.content).toBe(proContent);
        expect(result.isContentLocked).toBe(false);
        expect(prisma.subscription.count).not.toHaveBeenCalled();
      });

      it('cuts a pro blog in half for an anonymous reader', async () => {
        prisma.blog.findUnique.mockResolvedValue(proBlog());

        const result = await service.getBlogBySlug('a-blog');

        expect(result.blog.content).toBe(firstHalf);
        expect(result.isContentLocked).toBe(true);
        expect(prisma.subscription.count).not.toHaveBeenCalled();
      });

      // Otherwise the edit form would load the cut and save it over the body.
      it('returns a pro blog in full to its author', async () => {
        prisma.blog.findUnique.mockResolvedValue(proBlog());

        const result = await service.getBlogBySlug('a-blog', {
          id: 'author-1',
          role: 'user',
        });

        expect(result.blog.content).toBe(proContent);
        expect(result.isContentLocked).toBe(false);
        expect(prisma.subscription.count).not.toHaveBeenCalled();
      });

      it('returns a pro blog in full to an admin', async () => {
        prisma.blog.findUnique.mockResolvedValue(proBlog());

        const result = await service.getBlogBySlug('a-blog', {
          id: 'admin-1',
          role: 'admin',
        });

        expect(result.blog.content).toBe(proContent);
        expect(result.isContentLocked).toBe(false);
        expect(prisma.subscription.count).not.toHaveBeenCalled();
      });

      it('returns a pro blog in full to an active subscriber', async () => {
        prisma.blog.findUnique.mockResolvedValue(proBlog());
        prisma.subscription.count.mockResolvedValue(1);

        const result = await service.getBlogBySlug('a-blog', VIEWER);

        expect(result.blog.content).toBe(proContent);
        expect(result.isContentLocked).toBe(false);
        expect(prisma.subscription.count).toHaveBeenCalledWith({
          where: { referenceId: USER_ID, status: { in: PRO_STATUSES } },
        });
      });

      it('cuts a pro blog in half for a signed-in reader without a subscription', async () => {
        prisma.blog.findUnique.mockResolvedValue(proBlog());

        const result = await service.getBlogBySlug('a-blog', VIEWER);

        expect(result.blog.content).toBe(firstHalf);
        expect(result.isContentLocked).toBe(true);
      });

      // Reading time comes from it, so a locked reader must not see half the minutes.
      it('counts the words of the full body even when the content is cut', async () => {
        prisma.blog.findUnique.mockResolvedValue(proBlog());

        const result = await service.getBlogBySlug('a-blog');

        expect(result.blog.content).toBe(firstHalf);
        expect(result.wordCount).toBe(8);
      });

      it('counts the same words for a public blog', async () => {
        prisma.blog.findUnique.mockResolvedValue(
          blogRow({ content: proContent }),
        );

        const result = await service.getBlogBySlug('a-blog');

        expect(result.wordCount).toBe(8);
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
      shortDescription: 'A short preview',
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
      // Asked of the denormalised column, not the `like` table — same question,
      // answered from an index.
      it('returns only blogs that have at least one like', async () => {
        await service.getTrendingBlogs(USER_ID);

        expect(trendingArgs().where).toMatchObject({
          likesCount: { gt: 0 },
        });
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
          { likesCount: 'desc' },
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

      it('selects the short description, never the full content', async () => {
        await service.getTrendingBlogs(USER_ID);

        expect(trendingArgs().select).toMatchObject({ shortDescription: true });
        expect(trendingArgs().select).not.toHaveProperty('content');
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

  describe('createBlog', () => {
    const newBlog = (blogPro?: boolean) =>
      ({
        title: 'A blog',
        shortDescription: 'A short preview',
        content: '<p>Body text that is long enough</p>',
        tags: ['nest'],
        blogPro,
      }) as CreateBlogDto;

    it('rejects a pro blog from an author without a subscription', async () => {
      await expect(
        service.createBlog(undefined, newBlog(true), VIEWER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.blog.create).not.toHaveBeenCalled();
    });

    it('creates a pro blog for an active subscriber', async () => {
      prisma.subscription.count.mockResolvedValue(1);

      await service.createBlog(undefined, newBlog(true), VIEWER);

      expect(prisma.blog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ blogPro: true }) as unknown,
      });
    });

    it('lets an admin create a pro blog without a subscription lookup', async () => {
      await service.createBlog(undefined, newBlog(true), {
        id: 'admin-1',
        role: 'admin',
      });

      expect(prisma.blog.create).toHaveBeenCalled();
      expect(prisma.subscription.count).not.toHaveBeenCalled();
    });

    it('defaults to a public blog and skips the subscription lookup', async () => {
      await service.createBlog(undefined, newBlog(), VIEWER);

      expect(prisma.blog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ blogPro: false }) as unknown,
      });
      expect(prisma.subscription.count).not.toHaveBeenCalled();
    });
  });

  describe('updateBlog', () => {
    const existing = (blogPro: boolean) => ({
      title: 'A blog',
      slug: 'a-blog',
      coverImage: null,
      blogPro,
    });

    it('rejects turning Pro on without a subscription', async () => {
      prisma.blog.findUnique.mockResolvedValue(existing(false));

      await expect(
        service.updateBlog(
          'a-blog',
          undefined,
          { blogPro: true } as UpdateBlogDto,
          VIEWER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.blog.update).not.toHaveBeenCalled();
    });

    // A lapsed author can still fix a typo in a blog they made pro earlier.
    it('lets a lapsed author keep an existing pro blog pro', async () => {
      prisma.blog.findUnique.mockResolvedValue(existing(true));

      await service.updateBlog(
        'a-blog',
        undefined,
        {
          blogPro: true,
          content: '<p>Fixed a typo in here</p>',
        } as UpdateBlogDto,
        VIEWER,
      );

      expect(prisma.blog.update).toHaveBeenCalled();
      expect(prisma.subscription.count).not.toHaveBeenCalled();
    });

    it('lets a lapsed author turn Pro off', async () => {
      prisma.blog.findUnique.mockResolvedValue(existing(true));

      await service.updateBlog(
        'a-blog',
        undefined,
        { blogPro: false } as UpdateBlogDto,
        VIEWER,
      );

      expect(prisma.blog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ blogPro: false }) as unknown,
        }),
      );
    });

    it('turns Pro on for an active subscriber', async () => {
      prisma.blog.findUnique.mockResolvedValue(existing(false));
      prisma.subscription.count.mockResolvedValue(1);

      await service.updateBlog(
        'a-blog',
        undefined,
        { blogPro: true } as UpdateBlogDto,
        VIEWER,
      );

      expect(prisma.blog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ blogPro: true }) as unknown,
        }),
      );
    });
  });
});
