import { Test, TestingModule } from '@nestjs/testing';
import { subDays } from 'date-fns';
import { AdminService } from './admin.service';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { AdminUsersService } from './users/admin-users.service';

// Frozen so the 30 day cutoff is deterministic across runs.
const NOW = new Date('2026-09-06T12:00:00.000Z');

type CountMocks = {
  user: { count: jest.Mock };
  blog: { count: jest.Mock };
  report: { count: jest.Mock };
  like: { count: jest.Mock };
};

describe('AdminService', () => {
  let service: AdminService;
  let prisma: CountMocks;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);

    prisma = {
      user: { count: jest.fn() },
      blog: { count: jest.fn() },
      report: { count: jest.fn() },
      like: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: DatabaseService, useValue: prisma },
        { provide: S3ServiceService, useValue: {} },
        { provide: AdminUsersService, useValue: {} },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('getDashboardAnalytics', () => {
    it('returns the six dashboard analytics', async () => {
      // user.count is called twice: total users first, then active users.
      prisma.user.count
        .mockResolvedValueOnce(42) // totalUsers
        .mockResolvedValueOnce(17); // totalActiveUsers
      prisma.blog.count.mockResolvedValue(8);
      prisma.report.count.mockResolvedValue(3);
      prisma.like.count.mockResolvedValue(120);

      const analytics = await service.getDashboardAnalytics();

      expect(analytics).toEqual({
        totalUsers: 42,
        totalBlogs: 8,
        totalReports: 3,
        totalSubscribers: 10,
        totalActiveUsers: 17,
        totalBlogLikes: 120,
      });
    });

    it('counts active users from the past 30 days only', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.blog.count.mockResolvedValue(0);
      prisma.report.count.mockResolvedValue(0);
      prisma.like.count.mockResolvedValue(0);

      await service.getDashboardAnalytics();

      // First call is the unfiltered total, second is the active user window.
      expect(prisma.user.count).toHaveBeenNthCalledWith(1);
      expect(prisma.user.count).toHaveBeenNthCalledWith(2, {
        where: { lastActivityAt: { gte: subDays(NOW, 30) } },
      });
    });

    it('returns the placeholder subscriber count until subscriptions exist', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.blog.count.mockResolvedValue(0);
      prisma.report.count.mockResolvedValue(0);
      prisma.like.count.mockResolvedValue(0);

      const analytics = await service.getDashboardAnalytics();

      expect(analytics.totalSubscribers).toBe(10);
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
      prisma.like.count.mockImplementation(pending);

      const analytics = service.getDashboardAnalytics();

      // Let the synchronous portion of Promise.all dispatch every query.
      await Promise.resolve();

      expect(prisma.user.count).toHaveBeenCalledTimes(2);
      expect(prisma.blog.count).toHaveBeenCalledTimes(1);
      expect(prisma.report.count).toHaveBeenCalledTimes(1);
      expect(prisma.like.count).toHaveBeenCalledTimes(1);

      release.forEach((resolve) => resolve(0));

      await expect(analytics).resolves.toMatchObject({ totalUsers: 0 });
    });

    it('propagates database failures', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.blog.count.mockRejectedValue(new Error('connection lost'));
      prisma.report.count.mockResolvedValue(0);
      prisma.like.count.mockResolvedValue(0);

      await expect(service.getDashboardAnalytics()).rejects.toThrow(
        'connection lost',
      );
    });
  });
});
