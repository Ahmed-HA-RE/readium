import { Test, TestingModule } from '@nestjs/testing';
import { subDays } from 'date-fns';
import { AdminService } from './admin.service';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { AdminUsersService } from './users/admin-users.service';
import { UsersService } from '../users/users.service';
import { BlogsService } from '../blogs/blogs.service';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { AdminMyBlogsQueryDto } from './dto/admin-my-blogs-query-dto';
import { MyBlogsStatus } from '../users/dto/my-blogs-query-dto';
import { UpdateBlogDto } from '../blogs/dto/update-blog-dto';

// `mock`-prefixed so Jest allows the hoisted factory to reference it.
const mockRetrieveBalance = jest.fn<Promise<unknown>, []>();

jest.mock('../../lib/stripe', () => ({
  stripeClient: { balance: { retrieve: () => mockRetrieveBalance() } },
}));

// Frozen so the 30 day cutoff is deterministic across runs.
const NOW = new Date('2026-09-06T12:00:00.000Z');

type CountMocks = {
  user: { count: jest.Mock; findMany: jest.Mock };
  blog: { count: jest.Mock };
  report: { count: jest.Mock };
  subscription: { count: jest.Mock };
};

// The signed-in admin, as better-auth hands it to the controller.
const SESSION_USER = {
  id: 'admin-1',
  name: 'Ahmed',
  email: 'ahmed@example.com',
} as UserSession['user'];

type AdminUsersMocks = {
  getUserByUsername: jest.Mock;
  getUserBlogsByUsernameAsAdmin: jest.Mock;
  getUserCommentsByUsernameAsAdmin: jest.Mock;
};

describe('AdminService', () => {
  let service: AdminService;
  let prisma: CountMocks;
  let adminUsers: AdminUsersMocks;
  let users: { isUsernameTaken: jest.Mock; getMyBlogs: jest.Mock };
  let blogs: { updateBlog: jest.Mock; deleteBlog: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);

    prisma = {
      user: { count: jest.fn(), findMany: jest.fn() },
      blog: { count: jest.fn() },
      report: { count: jest.fn() },
      subscription: { count: jest.fn() },
    };
    mockRetrieveBalance.mockReset();

    adminUsers = {
      getUserByUsername: jest.fn().mockResolvedValue({ id: 'admin-1' }),
      getUserBlogsByUsernameAsAdmin: jest
        .fn()
        .mockResolvedValue({ blogs: [], totalPages: 0 }),
      getUserCommentsByUsernameAsAdmin: jest
        .fn()
        .mockResolvedValue({ data: [], nextCursor: null }),
    };

    users = {
      isUsernameTaken: jest.fn(),
      getMyBlogs: jest.fn().mockResolvedValue({
        blogs: [],
        totalPages: 0,
        counts: { published: 0, draft: 0 },
      }),
    };

    blogs = {
      updateBlog: jest.fn().mockResolvedValue({ success: true, data: {} }),
      deleteBlog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: DatabaseService, useValue: prisma },
        {
          provide: S3ServiceService,
          useValue: {
            getSignedUrl: jest.fn((key: string) =>
              Promise.resolve(`signed:${key}`),
            ),
          },
        },
        { provide: AdminUsersService, useValue: adminUsers },
        { provide: UsersService, useValue: users },
        { provide: BlogsService, useValue: blogs },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // The /api/admin/me family delegates to other services with the admin off
  // the session, so the subject can never be steered by a path param.
  describe('the /api/admin/me endpoints', () => {
    it('reads the profile without the moderation columns', async () => {
      await service.getMyDataAsAdmin(SESSION_USER);

      expect(adminUsers.getUserByUsername).toHaveBeenCalledWith('Ahmed', false);
    });

    it('lists the signed-in admin’s blogs exactly as the user dashboard does', async () => {
      const query = {
        status: MyBlogsStatus.DRAFT,
        search: 'nest',
        page: 2,
        limit: 5,
      } as AdminMyBlogsQueryDto;

      const page = await service.getMyBlogsAsAdmin(SESSION_USER, query);

      expect(users.getMyBlogs).toHaveBeenCalledWith(SESSION_USER, query);
      expect(page).toEqual({
        blogs: [],
        totalPages: 0,
        counts: { published: 0, draft: 0 },
      });
    });

    it('updates only the signed-in admin’s own blog', async () => {
      const dto = { title: 'A new title' } as UpdateBlogDto;

      await service.updateMyBlogAsAdmin(SESSION_USER, 'a-blog', undefined, dto);

      // The whole user, so the Pro check sees the admin role.
      expect(blogs.updateBlog).toHaveBeenCalledWith(
        'a-blog',
        undefined,
        dto,
        SESSION_USER,
      );
    });

    it('deletes only the signed-in admin’s own blog', async () => {
      await service.deleteMyBlogAsAdmin(SESSION_USER, 'a-blog');

      expect(blogs.deleteBlog).toHaveBeenCalledWith('a-blog', 'admin-1');
    });

    it('passes the comment cursor through for the signed-in admin', async () => {
      const query = { limit: 10, cursor: 'comment-9' };

      const page = await service.getMyCommentsAsAdmin(SESSION_USER, query);

      expect(adminUsers.getUserCommentsByUsernameAsAdmin).toHaveBeenCalledWith(
        'Ahmed',
        query,
      );
      expect(page).toEqual({ data: [], nextCursor: null });
    });

    it('never queries the database directly', async () => {
      await service.getMyDataAsAdmin(SESSION_USER);
      await service.getMyBlogsAsAdmin(SESSION_USER, {} as AdminMyBlogsQueryDto);
      await service.getMyCommentsAsAdmin(SESSION_USER, {});

      // Every /me read reuses an existing service, so the admin and user routes
      // can never drift into returning different shapes for the same data.
      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(prisma.blog.count).not.toHaveBeenCalled();
    });
  });

  describe('getSuggestions', () => {
    it('matches names case-insensitively, newest first, capped at 5', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getSuggestions({ q: 'ahm' });

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'ahm', mode: 'insensitive' } },
        select: { id: true, name: true, image: true, banned: true, role: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 5,
      });
    });

    it('does not filter out banned users or admins', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getSuggestions({});

      // No `banned` or `role` condition, unlike the public palette.
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('signs avatars, leaves missing ones null and keeps the badge fields', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          name: 'Ahmed',
          image: 'avatars/u1.png',
          banned: false,
          role: 'admin',
        },
        { id: 'u2', name: 'Sara', image: null, banned: true, role: 'user' },
      ]);

      await expect(service.getSuggestions({ q: 'a' })).resolves.toEqual([
        {
          id: 'u1',
          name: 'Ahmed',
          image: 'signed:avatars/u1.png',
          banned: false,
          role: 'admin',
        },
        { id: 'u2', name: 'Sara', image: null, banned: true, role: 'user' },
      ]);
    });
  });

  describe('getDashboardAnalytics', () => {
    const mockZeroCounts = () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.blog.count.mockResolvedValue(0);
      prisma.report.count.mockResolvedValue(0);
      prisma.subscription.count.mockResolvedValue(0);
      mockRetrieveBalance.mockResolvedValue({ available: [] });
    };

    it('returns the six dashboard analytics', async () => {
      // user.count is called twice: total users first, then active users.
      prisma.user.count
        .mockResolvedValueOnce(42) // totalUsers
        .mockResolvedValueOnce(17); // totalActiveUsers
      prisma.blog.count.mockResolvedValue(8);
      prisma.report.count.mockResolvedValue(3);
      prisma.subscription.count.mockResolvedValue(5);
      mockRetrieveBalance.mockResolvedValue({
        object: 'balance',
        available: [
          { amount: 666670, currency: 'usd', source_types: { card: 666670 } },
        ],
        pending: [{ amount: 61414, currency: 'usd' }],
      });

      const analytics = await service.getDashboardAnalytics();

      // Only `available` is used; `pending` and `source_types` are dropped.
      expect(analytics).toEqual({
        totalUsers: 42,
        totalBlogs: 8,
        totalReports: 3,
        totalSubscribers: 5,
        totalActiveUsers: 17,
        availableBalance: [{ amount: 666670, currency: 'usd' }],
      });
    });

    it('counts active users from the past 30 days only', async () => {
      mockZeroCounts();

      await service.getDashboardAnalytics();

      // First call is the unfiltered total, second is the active user window.
      expect(prisma.user.count).toHaveBeenNthCalledWith(1);
      expect(prisma.user.count).toHaveBeenNthCalledWith(2, {
        where: { lastActivityAt: { gte: subDays(NOW, 30) } },
      });
    });

    it('counts only active or trialing subscriptions', async () => {
      mockZeroCounts();

      await service.getDashboardAnalytics();

      expect(prisma.subscription.count).toHaveBeenCalledWith({
        where: { status: { in: ['active', 'trialing'] } },
      });
    });

    it('returns a null balance when Stripe fails, keeping the counts', async () => {
      mockZeroCounts();
      prisma.user.count.mockResolvedValue(4);
      mockRetrieveBalance.mockRejectedValue(new Error('stripe down'));

      const analytics = await service.getDashboardAnalytics();

      expect(analytics.availableBalance).toBeNull();
      expect(analytics.totalUsers).toBe(4);
    });

    it('issues every count concurrently rather than sequentially', async () => {
      const release: Array<(value: number) => void> = [];
      // None of these settle until we release them, so a sequential
      // implementation would stall after issuing only the first query.
      const pending = () =>
        new Promise<number>((resolve) => release.push(resolve));

      prisma.user.count.mockImplementation(pending);
      prisma.blog.count.mockImplementation(pending);
      prisma.report.count.mockImplementation(pending);
      prisma.subscription.count.mockImplementation(pending);
      mockRetrieveBalance.mockResolvedValue({ available: [] });

      const analytics = service.getDashboardAnalytics();

      // Let the synchronous portion of Promise.all dispatch every query.
      await Promise.resolve();

      expect(prisma.user.count).toHaveBeenCalledTimes(2);
      expect(prisma.blog.count).toHaveBeenCalledTimes(1);
      expect(prisma.report.count).toHaveBeenCalledTimes(1);
      expect(prisma.subscription.count).toHaveBeenCalledTimes(1);
      expect(mockRetrieveBalance).toHaveBeenCalledTimes(1);

      release.forEach((resolve) => resolve(0));

      await expect(analytics).resolves.toMatchObject({ totalUsers: 0 });
    });

    it('propagates database failures', async () => {
      mockZeroCounts();
      prisma.blog.count.mockRejectedValue(new Error('connection lost'));

      await expect(service.getDashboardAnalytics()).rejects.toThrow(
        'connection lost',
      );
    });
  });
});
