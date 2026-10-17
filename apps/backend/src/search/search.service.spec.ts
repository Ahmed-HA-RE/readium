import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { SuggestionQueryDto } from './dto/suggestion-query-dto';
import { Prisma } from '../generated/prisma/client';

// The arguments the service hands to Prisma. The mocks are typed with these so
// `mock.calls` is not an `any[]` and the assertions stay checked.
type UserFindManyArgs = {
  where: Prisma.UserWhereInput;
  select: Record<string, boolean>;
  orderBy: Prisma.UserOrderByWithRelationInput[];
  take: number;
};

type BlogFindManyArgs = {
  where: Prisma.BlogWhereInput;
  select: Record<string, unknown>;
  orderBy: Prisma.BlogOrderByWithRelationInput[];
  take: number;
};

type PrismaMocks = {
  user: { findMany: jest.Mock<Promise<unknown[]>, [UserFindManyArgs]> };
  blog: { findMany: jest.Mock<Promise<unknown[]>, [BlogFindManyArgs]> };
};

const query = (q?: string): SuggestionQueryDto => ({ q });

const userRow = { id: 'user-1', name: 'Ahmed', image: 'profile-key' };

const blogRow = {
  id: 'blog-1',
  title: 'A published blog',
  slug: 'a-published-blog',
  coverImage: 'cover-key',
  author: { name: 'Ahmed' },
};

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaMocks;
  let s3: { getSignedUrl: jest.Mock };

  const userArgs = () => prisma.user.findMany.mock.calls[0][0];
  const blogArgs = () => prisma.blog.findMany.mock.calls[0][0];

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest
          .fn<Promise<unknown[]>, [UserFindManyArgs]>()
          .mockResolvedValue([userRow]),
      },
      blog: {
        findMany: jest
          .fn<Promise<unknown[]>, [BlogFindManyArgs]>()
          .mockResolvedValue([blogRow]),
      },
    };
    s3 = { getSignedUrl: jest.fn().mockResolvedValue('https://signed/url') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: DatabaseService, useValue: prisma },
        { provide: S3ServiceService, useValue: s3 },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSuggestions', () => {
    it('takes three of each group', async () => {
      await service.getSuggestions(query());

      expect(userArgs().take).toBe(3);
      expect(blogArgs().take).toBe(3);
    });

    it('returns the newest rows first, with a total order', async () => {
      await service.getSuggestions(query());

      // The `id` tie-break is what makes the same term return the same three
      // rows; without it `createdAt` ties could reshuffle between requests.
      expect(userArgs().orderBy).toEqual([
        { createdAt: 'desc' },
        { id: 'desc' },
      ]);
      expect(blogArgs().orderBy).toEqual([
        { createdAt: 'desc' },
        { id: 'desc' },
      ]);
    });

    it('matches users case-insensitively by name', async () => {
      await service.getSuggestions(query('ahm'));

      expect(userArgs().where.name).toEqual({
        contains: 'ahm',
        mode: 'insensitive',
      });
    });

    it('matches blogs case-insensitively on the title or the content', async () => {
      await service.getSuggestions(query('nest'));

      expect(blogArgs().where.OR).toEqual([
        { title: { contains: 'nest', mode: 'insensitive' } },
        { content: { contains: 'nest', mode: 'insensitive' } },
      ]);
    });

    it('hides blogs by a banned author', async () => {
      await service.getSuggestions(query('nest'));

      expect(blogArgs().where.author).toEqual({ NOT: { banned: true } });
    });

    it('applies no text filter when the term is omitted', async () => {
      await service.getSuggestions(query());

      expect(userArgs().where.name).toBeUndefined();
      expect(blogArgs().where.OR).toBeUndefined();
    });

    it('never suggests a banned user', async () => {
      await service.getSuggestions(query('ahm'));

      expect(userArgs().where.NOT).toEqual({ banned: true });
    });

    it('never suggests an unpublished blog', async () => {
      await service.getSuggestions(query('nest'));

      expect(blogArgs().where.isPublished).toBe(true);
    });

    // Same rule as the feed in `BlogsService`: hidden from the reporter, and
    // from nobody else.
    it('never suggests a blog the caller has reported', async () => {
      await service.getSuggestions(query('nest'), 'user-1');

      expect(blogArgs().where).toMatchObject({
        report: { none: { userId: 'user-1' } },
      });
    });

    it('does not filter by report for anonymous callers', async () => {
      await service.getSuggestions(query('nest'));

      expect(blogArgs().where).not.toHaveProperty('report');
    });

    it('selects no email, role or moderation column for the anonymous caller', async () => {
      await service.getSuggestions(query());

      expect(Object.keys(userArgs().select).sort()).toEqual([
        'id',
        'image',
        'name',
      ]);
    });

    it('presigns the avatar and the cover image', async () => {
      const { users, blogs } = await service.getSuggestions(query());

      expect(s3.getSignedUrl).toHaveBeenCalledWith('profile-key');
      expect(s3.getSignedUrl).toHaveBeenCalledWith('cover-key');
      expect(users[0].image).toBe('https://signed/url');
      expect(blogs[0].coverImage).toBe('https://signed/url');
    });

    it('leaves a missing image null rather than signing it', async () => {
      prisma.user.findMany.mockResolvedValue([{ ...userRow, image: null }]);
      prisma.blog.findMany.mockResolvedValue([
        { ...blogRow, coverImage: null },
      ]);

      const { users, blogs } = await service.getSuggestions(query());

      expect(s3.getSignedUrl).not.toHaveBeenCalled();
      expect(users[0].image).toBeNull();
      expect(blogs[0].coverImage).toBeNull();
    });

    it('returns empty groups rather than throwing when nothing matches', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.blog.findMany.mockResolvedValue([]);

      await expect(service.getSuggestions(query('zzz'))).resolves.toEqual({
        users: [],
        blogs: [],
      });
    });
  });
});
