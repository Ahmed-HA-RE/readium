import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { CommentQueryDto } from './dto/comment-query-dto';
import { PRO_STATUSES } from '../../lib/constants';

type CommentFindManyArgs = {
  where: unknown;
  take: number;
  skip?: number;
  cursor?: { id: string };
  orderBy: unknown;
};

type CommentCreateArgs = {
  data: { content: string; blogId: string; authorId: string };
};

type CommentUpdateArgs = {
  where: { id: string };
  data: { content: string };
};

// Typed so `mock.calls[0][0]` is `unknown` rather than `any`, which the
// `no-unsafe-member-access` rule rejects.
type PrismaMocks = {
  blog: { findUnique: jest.Mock<Promise<unknown>, [unknown]> };
  comment: {
    findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
    findUnique: jest.Mock<Promise<unknown>, [unknown]>;
    create: jest.Mock<Promise<unknown>, [unknown]>;
    update: jest.Mock<Promise<unknown>, [unknown]>;
    delete: jest.Mock<Promise<unknown>, [unknown]>;
  };
  subscription: {
    findMany: jest.Mock<Promise<{ referenceId: string }[]>, [unknown]>;
  };
};

const SLUG = 'a-blog';

const commentRow = (id: string, image: string | null = 'avatar-key') => ({
  id,
  content: 'Great read',
  blogId: 'blog-1',
  authorId: 'user-1',
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  author: { id: 'user-1', name: 'Ahmed', image },
});

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: PrismaMocks;
  let s3: { getSignedUrl: jest.Mock };

  const findManyArgs = () =>
    prisma.comment.findMany.mock.calls[0][0] as CommentFindManyArgs;

  beforeEach(async () => {
    prisma = {
      blog: {
        findUnique: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue({ id: 'blog-1' }),
      },
      comment: {
        findMany: jest
          .fn<Promise<unknown[]>, [unknown]>()
          .mockResolvedValue([]),
        findUnique: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue(commentRow('comment-1')),
        delete: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
        create: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockImplementation((args) =>
            Promise.resolve({
              ...commentRow('new-comment'),
              ...(args as CommentCreateArgs).data,
            }),
          ),
        update: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockImplementation((args) =>
            Promise.resolve({
              ...commentRow('comment-1'),
              ...(args as CommentUpdateArgs).data,
            }),
          ),
      },
      subscription: {
        findMany: jest
          .fn<Promise<{ referenceId: string }[]>, [unknown]>()
          .mockResolvedValue([]),
      },
    };

    s3 = { getSignedUrl: jest.fn((key: string) => `signed:${key}`) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: DatabaseService, useValue: prisma },
        { provide: S3ServiceService, useValue: s3 },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  describe('getCommentsForBlog', () => {
    const query = (partial: Partial<CommentQueryDto>) =>
      partial as CommentQueryDto;

    describe('query', () => {
      // A draft has no comment thread, so its slug yields an empty list.
      it('scopes the comments to the published blog with the slug', async () => {
        await service.getCommentsForBlog(query({ limit: 2 }), SLUG);

        expect(findManyArgs().where).toEqual({
          blog: { slug: SLUG, isPublished: true },
        });
      });

      it('takes the requested limit', async () => {
        await service.getCommentsForBlog(query({ limit: 2 }), SLUG);

        expect(findManyArgs().take).toBe(2);
      });

      // Ordering on `createdAt` alone leaves ties ambiguous under a cursor on
      // `id`, so a page could skip or repeat a comment.
      it('orders newest first with a total order', async () => {
        await service.getCommentsForBlog(query({ limit: 2 }), SLUG);

        expect(findManyArgs().orderBy).toEqual([
          { createdAt: 'desc' },
          { id: 'desc' },
        ]);
      });

      it('starts after the cursor, skipping the cursor row itself', async () => {
        await service.getCommentsForBlog(
          query({ limit: 2, cursor: 'comment-2' }),
          SLUG,
        );

        expect(findManyArgs()).toMatchObject({
          cursor: { id: 'comment-2' },
          skip: 1,
        });
      });

      it('sends no cursor or skip on the first page', async () => {
        await service.getCommentsForBlog(query({ limit: 2 }), SLUG);

        expect(findManyArgs()).not.toHaveProperty('cursor');
        expect(findManyArgs()).not.toHaveProperty('skip');
      });
    });

    describe('nextCursor', () => {
      it('points at the last comment when the page came back full', async () => {
        prisma.comment.findMany.mockResolvedValue([
          commentRow('comment-1'),
          commentRow('comment-2'),
        ]);

        const { nextCursor } = await service.getCommentsForBlog(
          query({ limit: 2 }),
          SLUG,
        );

        expect(nextCursor).toBe('comment-2');
      });

      it('is null when the page came back short, ending the feed', async () => {
        prisma.comment.findMany.mockResolvedValue([commentRow('comment-1')]);

        const { nextCursor } = await service.getCommentsForBlog(
          query({ limit: 2 }),
          SLUG,
        );

        expect(nextCursor).toBeNull();
      });

      it('is null for a blog with no comments', async () => {
        const result = await service.getCommentsForBlog(
          query({ limit: 2 }),
          SLUG,
        );

        expect(result).toEqual({ data: [], nextCursor: null });
      });
    });

    describe('author avatar', () => {
      it('signs a stored S3 key', async () => {
        prisma.comment.findMany.mockResolvedValue([commentRow('comment-1')]);

        const { data } = await service.getCommentsForBlog(
          query({ limit: 2 }),
          SLUG,
        );

        expect(data[0].author.image).toBe('signed:avatar-key');
      });

      // Regression: OAuth sign-ups store the provider URL, and signing it as
      // an object key produced a broken avatar on every comment they wrote.
      it.each([
        'https://lh3.googleusercontent.com/a/photo.jpg',
        'http://avatars.githubusercontent.com/u/1',
      ])('returns the external URL %s unsigned', async (url) => {
        prisma.comment.findMany.mockResolvedValue([
          commentRow('comment-1', url),
        ]);

        const { data } = await service.getCommentsForBlog(
          query({ limit: 2 }),
          SLUG,
        );

        expect(data[0].author.image).toBe(url);
        expect(s3.getSignedUrl).not.toHaveBeenCalled();
      });

      it('leaves a missing avatar null without signing', async () => {
        prisma.comment.findMany.mockResolvedValue([
          commentRow('comment-1', null),
        ]);

        const { data } = await service.getCommentsForBlog(
          query({ limit: 2 }),
          SLUG,
        );

        expect(data[0].author.image).toBeNull();
        expect(s3.getSignedUrl).not.toHaveBeenCalled();
      });
    });

    describe('author pro status', () => {
      const otherAuthorRow = (id: string) => ({
        ...commentRow(id),
        authorId: 'user-2',
        author: { id: 'user-2', name: 'Sara', image: null },
      });

      it('flags only the authors with an active subscription', async () => {
        prisma.comment.findMany.mockResolvedValue([
          commentRow('c-1'),
          otherAuthorRow('c-2'),
        ]);
        prisma.subscription.findMany.mockResolvedValue([
          { referenceId: 'user-2' },
        ]);

        const { data } = await service.getCommentsForBlog(query({}), SLUG);

        expect(data.map(({ author }) => author.isPro)).toEqual([false, true]);
      });

      it('looks up each author once, in one query for the page', async () => {
        prisma.comment.findMany.mockResolvedValue([
          commentRow('c-1'),
          commentRow('c-2'),
          otherAuthorRow('c-3'),
        ]);

        await service.getCommentsForBlog(query({}), SLUG);

        expect(prisma.subscription.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.subscription.findMany).toHaveBeenCalledWith({
          where: {
            referenceId: { in: ['user-1', 'user-2'] },
            status: { in: PRO_STATUSES },
          },
          select: { referenceId: true },
        });
      });

      it('skips the lookup for an empty page', async () => {
        await service.getCommentsForBlog(query({}), SLUG);

        expect(prisma.subscription.findMany).not.toHaveBeenCalled();
      });
    });
  });

  describe('createComment', () => {
    it('saves the comment against the blog and the caller', async () => {
      await service.createComment({ content: 'Great read' }, SLUG, 'user-1');

      const { data } = prisma.comment.create.mock
        .calls[0][0] as CommentCreateArgs;
      expect(data).toEqual({
        content: 'Great read',
        blogId: 'blog-1',
        authorId: 'user-1',
      });
    });

    it('signs the author avatar in the response', async () => {
      const comment = await service.createComment(
        { content: 'Great read' },
        SLUG,
        'user-1',
      );

      expect(comment.author.image).toBe('signed:avatar-key');
    });

    it('throws NotFoundException for an unknown blog', async () => {
      prisma.blog.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment({ content: 'Great read' }, 'missing', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });
  });

  describe('updateComment', () => {
    const update = (authorId = 'user-1', slug = SLUG) =>
      service.updateComment(
        { content: 'Edited read' },
        slug,
        'comment-1',
        authorId,
      );

    it('scopes the lookup to the blog and the caller as author', async () => {
      await update();

      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1', authorId: 'user-1', blogId: 'blog-1' },
      });
    });

    it('saves only the new content on the found comment', async () => {
      await update();

      const { where, data } = prisma.comment.update.mock
        .calls[0][0] as CommentUpdateArgs;
      expect(where).toEqual({ id: 'comment-1' });
      expect(data).toEqual({ content: 'Edited read' });
    });

    it('signs the author avatar in the response', async () => {
      const comment = await update();

      expect(comment.content).toBe('Edited read');
      expect(comment.author.image).toBe('signed:avatar-key');
    });

    // The author-scoped lookup misses, so a non-author sees 404 rather than 403.
    it('throws NotFoundException for a user who did not write it', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(update('user-2')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.comment.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown blog', async () => {
      prisma.blog.findUnique.mockResolvedValue(null);

      await expect(update('user-1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.comment.findUnique).not.toHaveBeenCalled();
      expect(prisma.comment.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    const owner = { id: 'user-1', role: 'user' };
    const stranger = { id: 'user-2', role: 'user' };
    const admin = { id: 'admin-1', role: 'admin' };

    it('lets the comment author delete it', async () => {
      await service.deleteComment(SLUG, 'comment-1', owner);

      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
    });

    it('scopes the lookup to the blog, so an id from another blog misses', async () => {
      await service.deleteComment(SLUG, 'comment-1', owner);

      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1', blogId: 'blog-1' },
      });
    });

    it('lets an admin delete any comment', async () => {
      await service.deleteComment(SLUG, 'comment-1', admin);

      expect(prisma.comment.delete).toHaveBeenCalled();
    });

    it('throws ForbiddenException for a user who did not write it', async () => {
      await expect(
        service.deleteComment(SLUG, 'comment-1', stranger),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown comment', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteComment(SLUG, 'missing', owner),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown blog', async () => {
      prisma.blog.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteComment('missing', 'comment-1', owner),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.comment.findUnique).not.toHaveBeenCalled();
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });
  });
});
