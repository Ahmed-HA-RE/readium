import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AdminReportsService } from './admin-reports.service';
import { DatabaseService } from '../../database/database.service';
import { S3ServiceService } from '../../s3-service/s3-service.service';
import { ReportQueryDto } from './dto/report-query-dto';
import {
  ModerationAction,
  ReportReason,
  ReportStatus,
} from '../../generated/prisma/enums';

// `mock`-prefixed so Jest allows the hoisted factories to reference them.
const mockBanUser = jest.fn<Promise<unknown>, [unknown]>();
const mockSendBan = jest.fn<Promise<unknown>, [unknown]>();
const mockSendWarning = jest.fn<Promise<unknown>, [unknown]>();

jest.mock('../../../lib/auth', () => ({
  auth: { api: { banUser: (args: unknown) => mockBanUser(args) } },
}));
jest.mock('../../../mails/send-ban-notification', () => ({
  __esModule: true,
  default: (args: unknown) => mockSendBan(args),
}));
jest.mock('../../../mails/send-warning-notification', () => ({
  __esModule: true,
  default: (args: unknown) => mockSendWarning(args),
}));

type ReportMocks = {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  findUniqueOrThrow: jest.Mock;
  updateMany: jest.Mock;
  count: jest.Mock;
};

type PrismaMocks = {
  report: ReportMocks;
  blog: { update: jest.Mock };
  $transaction: jest.Mock;
};

const author = {
  id: 'author-1',
  role: 'user',
  email: 'author@example.com',
  name: 'Sara',
  banned: false,
  banExpires: null as Date | null,
};

const existingReport = (overrides: Record<string, unknown> = {}) => ({
  id: 'report-1',
  reason: ReportReason.SPAM,
  status: ReportStatus.PENDING,
  action: null,
  userId: 'reporter-1',
  blogId: 'blog-1',
  blog: { title: 'My Story', author: { ...author } },
  ...overrides,
});

const req = { headers: new Headers({ cookie: 'session=abc' }) } as Request;
const THIRTY_DAYS = 30 * 24 * 60 * 60;

describe('AdminReportsService', () => {
  let service: AdminReportsService;
  let prisma: PrismaMocks;
  let s3: { getSignedUrl: jest.Mock };

  beforeEach(async () => {
    prisma = {
      report: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      blog: { update: jest.fn() },
      $transaction: jest.fn(),
    };
    // The interactive transaction runs its callback against the same mocks.
    prisma.$transaction.mockImplementation(
      (fn: (tx: PrismaMocks) => Promise<unknown>) => fn(prisma),
    );
    s3 = {
      getSignedUrl: jest.fn((key: string) =>
        Promise.resolve(`https://signed/${key}`),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminReportsService,
        { provide: DatabaseService, useValue: prisma },
        { provide: S3ServiceService, useValue: s3 },
      ],
    }).compile();

    service = module.get<AdminReportsService>(AdminReportsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getAllReportsAsAdmin', () => {
    const reportRow = {
      id: 'report-1',
      reason: ReportReason.SPAM,
      status: ReportStatus.PENDING,
      action: null,
      user: { id: 'reporter-1', name: 'Omar', image: 'reporter-key' },
      blog: {
        id: 'blog-1',
        title: 'My Story',
        slug: 'my-story',
        author: { id: 'author-1', name: 'Sara', image: null },
      },
    };

    beforeEach(() => {
      prisma.report.findMany.mockResolvedValue([reportRow]);
      prisma.report.count.mockResolvedValue(12);
    });

    const findManyArgs = () =>
      (
        prisma.report.findMany.mock.calls[0] as [
          { where: unknown; skip: number; take: number },
        ]
      )[0];

    it('combines the reporter, reason and status filters', async () => {
      await service.getAllReportsAsAdmin({
        reporterName: 'oma',
        reason: ReportReason.SPAM,
        status: ReportStatus.PENDING,
      } as ReportQueryDto);

      expect(findManyArgs().where).toEqual({
        user: { name: { contains: 'oma', mode: 'insensitive' } },
        reason: ReportReason.SPAM,
        status: ReportStatus.PENDING,
      });
    });

    it('narrows to one report when a notification links to it', async () => {
      await service.getAllReportsAsAdmin({
        reportId: 'report-1',
      } as ReportQueryDto);

      expect(findManyArgs().where).toEqual({ id: 'report-1' });
    });

    it('counts with the same filter it lists with', async () => {
      await service.getAllReportsAsAdmin({
        status: ReportStatus.PENDING,
      } as ReportQueryDto);

      expect(prisma.report.count).toHaveBeenCalledWith({
        where: findManyArgs().where,
      });
    });

    it('pages with skip and take and derives totalPages from the limit', async () => {
      const result = await service.getAllReportsAsAdmin({
        page: 3,
        limit: 5,
      } as ReportQueryDto);

      expect(findManyArgs()).toMatchObject({ skip: 10, take: 5 });
      expect(result.totalPages).toBe(3);
    });

    it('signs the reporter avatar and leaves a missing author avatar null', async () => {
      const { reports } = await service.getAllReportsAsAdmin(
        {} as ReportQueryDto,
      );

      expect(s3.getSignedUrl).toHaveBeenCalledTimes(1);
      expect(reports[0].user.image).toBe('https://signed/reporter-key');
      expect(reports[0].blog.author.image).toBeNull();
    });
  });

  describe('updateReportStatusAsAdmin', () => {
    beforeEach(() => {
      prisma.report.findUnique.mockResolvedValue(existingReport());
      prisma.report.updateMany.mockResolvedValue({ count: 1 });
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.findUniqueOrThrow.mockResolvedValue({
        ...existingReport(),
        status: ReportStatus.RESOLVED,
      });
    });

    const resolve = (action: ModerationAction) =>
      service.updateReportStatusAsAdmin(
        'report-1',
        { status: ReportStatus.RESOLVED, action },
        req,
      );

    describe('guards', () => {
      it('throws 404 when the report does not exist', async () => {
        prisma.report.findUnique.mockResolvedValue(null);

        await expect(resolve(ModerationAction.WARNING)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('throws 400 when the report is no longer pending', async () => {
        prisma.report.findUnique.mockResolvedValue(
          existingReport({ status: ReportStatus.RESOLVED }),
        );

        await expect(resolve(ModerationAction.WARNING)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('throws 400 when the author is an admin', async () => {
        prisma.report.findUnique.mockResolvedValue(
          existingReport({
            blog: { title: 'My Story', author: { ...author, role: 'admin' } },
          }),
        );

        await expect(resolve(ModerationAction.PERMANENT_BAN)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('throws 400 when a rejection carries an action', async () => {
        await expect(
          service.updateReportStatusAsAdmin(
            'report-1',
            {
              status: ReportStatus.REJECTED,
              action: ModerationAction.WARNING,
            },
            req,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('opens no transaction when a guard fails', async () => {
        prisma.report.findUnique.mockResolvedValue(null);

        await expect(resolve(ModerationAction.WARNING)).rejects.toThrow();
        expect(prisma.$transaction).not.toHaveBeenCalled();
      });
    });

    describe('claim', () => {
      it('claims the report only while it is still pending', async () => {
        await resolve(ModerationAction.WARNING);

        expect(prisma.report.updateMany).toHaveBeenNthCalledWith(1, {
          where: { id: 'report-1', status: ReportStatus.PENDING },
          data: {
            status: ReportStatus.RESOLVED,
            action: ModerationAction.WARNING,
          },
        });
      });

      it('throws 409 when another review claimed it first', async () => {
        prisma.report.updateMany.mockResolvedValueOnce({ count: 0 });

        await expect(resolve(ModerationAction.PERMANENT_BAN)).rejects.toThrow(
          ConflictException,
        );
      });

      it('touches nothing else and notifies no one after a 409', async () => {
        prisma.report.updateMany.mockResolvedValueOnce({ count: 0 });

        await expect(resolve(ModerationAction.PERMANENT_BAN)).rejects.toThrow();
        expect(prisma.report.findMany).not.toHaveBeenCalled();
        expect(prisma.blog.update).not.toHaveBeenCalled();
        expect(mockBanUser).not.toHaveBeenCalled();
        expect(mockSendBan).not.toHaveBeenCalled();
      });
    });

    describe('reject', () => {
      const reject = () =>
        service.updateReportStatusAsAdmin(
          'report-1',
          { status: ReportStatus.REJECTED },
          req,
        );

      it('answers this report only, leaving the story and its other reports alone', async () => {
        await reject();

        expect(prisma.report.updateMany).toHaveBeenCalledTimes(1);
        expect(prisma.report.findMany).not.toHaveBeenCalled();
        expect(prisma.blog.update).not.toHaveBeenCalled();
      });

      it('sends no email and bans no one', async () => {
        await reject();

        expect(mockSendWarning).not.toHaveBeenCalled();
        expect(mockSendBan).not.toHaveBeenCalled();
        expect(mockBanUser).not.toHaveBeenCalled();
      });
    });

    describe('resolve', () => {
      beforeEach(() => {
        prisma.report.findMany.mockResolvedValue([
          { id: 'report-2', reason: ReportReason.HARASSMENT },
          { id: 'report-3', reason: ReportReason.SPAM },
        ]);
      });

      it('runs the claim, the other reports and the unpublish in one transaction', async () => {
        await resolve(ModerationAction.WARNING);

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(prisma.report.updateMany).toHaveBeenCalledTimes(2);
        expect(prisma.blog.update).toHaveBeenCalledTimes(1);
      });

      it("closes the story's other pending reports", async () => {
        await resolve(ModerationAction.WARNING);

        expect(prisma.report.findMany).toHaveBeenCalledWith({
          where: { blogId: 'blog-1', status: ReportStatus.PENDING },
          select: { id: true, reason: true },
        });
        expect(prisma.report.updateMany).toHaveBeenNthCalledWith(2, {
          where: { id: { in: ['report-2', 'report-3'] } },
          data: { status: ReportStatus.RESOLVED },
        });
      });

      it('unpublishes the story', async () => {
        await resolve(ModerationAction.WARNING);

        expect(prisma.blog.update).toHaveBeenCalledWith({
          where: { id: 'blog-1' },
          data: { isPublished: false },
        });
      });

      it('sends one warning listing every distinct reason, and bans no one', async () => {
        await resolve(ModerationAction.WARNING);

        expect(mockSendWarning).toHaveBeenCalledTimes(1);
        expect(mockSendWarning).toHaveBeenCalledWith({
          email: 'author@example.com',
          authorName: 'Sara',
          blogTitle: 'My Story',
          banReason: 'Spam, Harassment',
        });
        expect(mockBanUser).not.toHaveBeenCalled();
      });

      it('bans for 30 days and sends one temporary ban email', async () => {
        await resolve(ModerationAction.TEMPORARY_BAN);

        expect(mockBanUser).toHaveBeenCalledWith({
          body: {
            userId: 'author-1',
            banReason: 'Spam, Harassment',
            banExpiresIn: THIRTY_DAYS,
          },
          headers: req.headers,
        });
        expect(mockSendBan).toHaveBeenCalledTimes(1);
        expect(mockSendBan).toHaveBeenCalledWith(
          expect.objectContaining({ banType: 'temporary' }),
        );
      });

      it('bans with no expiry and sends one permanent ban email', async () => {
        await resolve(ModerationAction.PERMANENT_BAN);

        const [{ body }] = mockBanUser.mock.calls[0] as [
          { body: Record<string, unknown> },
        ];
        expect(body).not.toHaveProperty('banExpiresIn');
        expect(mockSendBan).toHaveBeenCalledWith(
          expect.objectContaining({ banType: 'permanent' }),
        );
        expect(mockSendWarning).not.toHaveBeenCalled();
      });

      it('skips a temporary ban when the author is already banned for good', async () => {
        prisma.report.findUnique.mockResolvedValue(
          existingReport({
            blog: { title: 'My Story', author: { ...author, banned: true } },
          }),
        );

        await resolve(ModerationAction.TEMPORARY_BAN);

        expect(prisma.blog.update).toHaveBeenCalled();
        expect(mockBanUser).not.toHaveBeenCalled();
        expect(mockSendBan).not.toHaveBeenCalled();
      });

      it('still extends a temporary ban that has an expiry', async () => {
        prisma.report.findUnique.mockResolvedValue(
          existingReport({
            blog: {
              title: 'My Story',
              author: {
                ...author,
                banned: true,
                banExpires: new Date('2026-11-01'),
              },
            },
          }),
        );

        await resolve(ModerationAction.TEMPORARY_BAN);

        expect(mockBanUser).toHaveBeenCalledTimes(1);
      });

      it('reports banFailed false when the ban goes through', async () => {
        const result = await resolve(ModerationAction.PERMANENT_BAN);

        expect(result.banFailed).toBe(false);
      });

      // The review is already committed, so failing the request would hide that it went through.
      it('still resolves and flags banFailed when banUser throws', async () => {
        mockBanUser.mockRejectedValueOnce(new Error('auth down'));

        const result = await resolve(ModerationAction.TEMPORARY_BAN);

        expect(result).toMatchObject({
          status: ReportStatus.RESOLVED,
          banFailed: true,
        });
      });

      it('sends no ban email when banUser throws', async () => {
        mockBanUser.mockRejectedValueOnce(new Error('auth down'));

        await resolve(ModerationAction.PERMANENT_BAN);

        expect(mockSendBan).not.toHaveBeenCalled();
      });

      it('notifies only after the transaction commits', async () => {
        prisma.$transaction.mockRejectedValueOnce(new Error('rollback'));

        await expect(resolve(ModerationAction.PERMANENT_BAN)).rejects.toThrow(
          'rollback',
        );
        expect(mockBanUser).not.toHaveBeenCalled();
        expect(mockSendBan).not.toHaveBeenCalled();
      });

      it('returns the claimed report', async () => {
        const result = await resolve(ModerationAction.WARNING);

        expect(prisma.report.findUniqueOrThrow).toHaveBeenCalledWith({
          where: { id: 'report-1' },
        });
        expect(result.status).toBe(ReportStatus.RESOLVED);
      });
    });
  });
});
