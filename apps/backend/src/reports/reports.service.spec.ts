import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReportDto } from './dto/create-report-dto';

// The real gateway imports `better-auth`, which is ESM-only and Jest cannot parse.
jest.mock('../notifications/notifications.gateway', () => ({
  NotificationsGateway: class {},
}));

// The confirmation email goes through Resend and a React template, neither of which these tests need.
jest.mock('../../mails/send-report-confirmation', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

type NotificationsMocks = {
  createReportNotificationForAdmins: jest.Mock<
    Promise<unknown[]>,
    [string, string, string]
  >;
  deleteLikeNotification: jest.Mock<Promise<void>, [string, string, string]>;
};

type PrismaMocks = {
  blog: {
    findUnique: jest.Mock<Promise<unknown>, [unknown]>;
    update: jest.Mock<Promise<unknown>, [unknown]>;
  };
  report: {
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
    create: jest.Mock<Promise<unknown>, [unknown]>;
  };
  like: {
    deleteMany: jest.Mock<Promise<{ count: number }>, [unknown]>;
  };
  $transaction: jest.Mock<Promise<unknown>, [(tx: unknown) => unknown]>;
};

const SLUG = 'a-blog';
const READER_ID = 'user-1';
const AUTHOR_ID = 'author-1';
const BLOG_ID = 'blog-1';

const dto = { reason: 'SPAM' } as CreateReportDto;

const reportRow = {
  id: 'report-1',
  reason: 'SPAM',
  status: 'PENDING',
  userId: READER_ID,
  blogId: BLOG_ID,
  createdAt: new Date('2026-10-28T00:00:00.000Z'),
  updatedAt: new Date('2026-10-28T00:00:00.000Z'),
  blog: { title: 'A Blog' },
  user: { email: 'reader@example.com', name: 'Reader' },
};

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaMocks;
  let notifications: NotificationsMocks;

  beforeEach(async () => {
    notifications = {
      createReportNotificationForAdmins: jest
        .fn<Promise<unknown[]>, [string, string, string]>()
        .mockResolvedValue([]),
      deleteLikeNotification: jest
        .fn<Promise<void>, [string, string, string]>()
        .mockResolvedValue(undefined),
    };

    prisma = {
      blog: {
        findUnique: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue({ id: BLOG_ID, authorId: AUTHOR_ID }),
        update: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
      },
      report: {
        findFirst: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue(null),
        create: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue(reportRow),
      },
      like: {
        deleteMany: jest
          .fn<Promise<{ count: number }>, [unknown]>()
          .mockResolvedValue({ count: 0 }),
      },
      // An interactive transaction hands its callback a client; the mocks stand in for it.
      $transaction: jest
        .fn<Promise<unknown>, [(tx: unknown) => unknown]>()
        .mockImplementation((callback) => Promise.resolve(callback(prisma))),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: DatabaseService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('createReport', () => {
    it("removes the reporter's like and lowers likesCount in the same transaction", async () => {
      prisma.like.deleteMany.mockResolvedValue({ count: 1 });

      await service.createReport(dto, SLUG, READER_ID);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.like.deleteMany).toHaveBeenCalledWith({
        where: { userId: READER_ID, blogId: BLOG_ID },
      });
      expect(prisma.blog.update).toHaveBeenCalledWith({
        where: { id: BLOG_ID },
        data: { likesCount: { decrement: 1 } },
      });
    });

    it("deletes the author's notification for the removed like", async () => {
      prisma.like.deleteMany.mockResolvedValue({ count: 1 });

      await service.createReport(dto, SLUG, READER_ID);

      expect(notifications.deleteLikeNotification).toHaveBeenCalledWith(
        READER_ID,
        AUTHOR_ID,
        BLOG_ID,
      );
    });

    // Decrementing without a removed row would push `likesCount` below the real number of likes.
    it('leaves likesCount and notifications alone when the reporter had not liked the blog', async () => {
      await service.createReport(dto, SLUG, READER_ID);

      expect(prisma.blog.update).not.toHaveBeenCalled();
      expect(notifications.deleteLikeNotification).not.toHaveBeenCalled();
    });

    it('still saves the report and notifies the admins', async () => {
      const report = await service.createReport(dto, SLUG, READER_ID);

      expect(report.id).toBe('report-1');
      expect(
        notifications.createReportNotificationForAdmins,
      ).toHaveBeenCalledWith(READER_ID, BLOG_ID, 'report-1');
    });

    it('writes nothing when the reader already reported the blog', async () => {
      prisma.report.findFirst.mockResolvedValue({ id: 'report-0' });

      await expect(service.createReport(dto, SLUG, READER_ID)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
