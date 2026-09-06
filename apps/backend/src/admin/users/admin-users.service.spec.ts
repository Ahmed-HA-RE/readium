import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { DatabaseService } from '../../database/database.service';
import { S3ServiceService } from '../../s3-service/s3-service.service';

type PrismaMocks = {
  user: { findUnique: jest.Mock };
  comment: { findMany: jest.Mock };
  blog: { count: jest.Mock };
};

// Shape returned by buildAdminUserSelect: scalars plus counts, no relation lists.
const userRow = {
  id: 'user-1',
  name: 'Ahmed',
  email: 'ahmed@example.com',
  image: 'profile-key',
  website: null,
  bio: null,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  banned: false,
  banReason: null,
  _count: { blogs: 3, comments: 30, bookmarks: 1, likes: 7 },
};

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: PrismaMocks;
  let s3: { getSignedUrl: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      comment: { findMany: jest.fn() },
      blog: { count: jest.fn() },
    };
    s3 = { getSignedUrl: jest.fn().mockResolvedValue('https://signed/url') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: DatabaseService, useValue: prisma },
        { provide: S3ServiceService, useValue: s3 },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getUserByUsername', () => {
    it('selects the moderation columns by default', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserByUsername('Ahmed');

      const { where, select } = prisma.user.findUnique.mock.calls[0][0];
      expect(where).toEqual({ name: 'Ahmed' });
      expect(select.banned).toBe(true);
      expect(select.banReason).toBe(true);
    });

    it('omits the moderation columns for the self view', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserByUsername('Ahmed', false);

      const { select } = prisma.user.findUnique.mock.calls[0][0];
      expect(select.banned).toBe(false);
      expect(select.banReason).toBe(false);
    });

    it('requests counts but no embedded blog or comment lists', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      await service.getUserByUsername('Ahmed');

      const { select } = prisma.user.findUnique.mock.calls[0][0];
      // The lists are served by the paginated /blogs and /comments endpoints,
      // so embedding them here would create a cursor seam at page two.
      expect(select.blogs).toBeUndefined();
      expect(select.comments).toBeUndefined();
      expect(select._count).toEqual({
        select: { blogs: true, comments: true, bookmarks: true, likes: true },
      });
    });

    it('signs the profile image', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow });

      const user = await service.getUserByUsername('Ahmed');

      expect(s3.getSignedUrl).toHaveBeenCalledWith('profile-key');
      expect(user.image).toBe('https://signed/url');
    });

    it('leaves a null image alone', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...userRow, image: null });

      const user = await service.getUserByUsername('Ahmed');

      expect(s3.getSignedUrl).not.toHaveBeenCalled();
      expect(user.image).toBeNull();
    });

    it('throws NotFound when the username does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserByUsername('ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserCommentsByUsernameAsAdmin', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.comment.findMany.mockResolvedValue([]);
    });

    it('orders by a total sort so the cursor position is unambiguous', async () => {
      await service.getUserCommentsByUsernameAsAdmin('Ahmed', {});

      const { orderBy } = prisma.comment.findMany.mock.calls[0][0];
      // createdAt alone is not unique: the seed inserts many comments inside
      // one second, and a cursor on id would then skip or repeat rows.
      expect(orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
    });

    it('skips the cursor row itself when paginating', async () => {
      await service.getUserCommentsByUsernameAsAdmin('Ahmed', {
        cursor: 'comment-9',
      });

      const args = prisma.comment.findMany.mock.calls[0][0];
      expect(args.cursor).toEqual({ id: 'comment-9' });
      expect(args.skip).toBe(1);
    });

    it('omits cursor arguments on the first page', async () => {
      await service.getUserCommentsByUsernameAsAdmin('Ahmed', {});

      const args = prisma.comment.findMany.mock.calls[0][0];
      expect(args.cursor).toBeUndefined();
      expect(args.skip).toBeUndefined();
    });

    it('returns the last row id as the next cursor', async () => {
      prisma.comment.findMany.mockResolvedValue([
        { id: 'c1', content: 'a', createdAt: new Date(), blog: {} },
        { id: 'c2', content: 'b', createdAt: new Date(), blog: {} },
      ]);

      const page = await service.getUserCommentsByUsernameAsAdmin('Ahmed', {});

      expect(page.nextCursor).toBe('c2');
    });

    it('returns a null cursor when the page is empty', async () => {
      const page = await service.getUserCommentsByUsernameAsAdmin('Ahmed', {});

      expect(page.nextCursor).toBeNull();
    });

    it('throws NotFound when the username does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getUserCommentsByUsernameAsAdmin('ghost', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
