import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LikesService } from './likes.service';
import { DatabaseService } from '../database/database.service';

type PrismaMocks = {
  blog: {
    findUnique: jest.Mock<Promise<unknown>, [unknown]>;
    update: jest.Mock<Promise<unknown>, [unknown]>;
  };
  like: {
    findUnique: jest.Mock<Promise<unknown>, [unknown]>;
    create: jest.Mock<Promise<unknown>, [unknown]>;
    delete: jest.Mock<Promise<unknown>, [unknown]>;
  };
  $transaction: jest.Mock<Promise<unknown[]>, [unknown[]]>;
};

const SLUG = 'a-blog';
const READER_ID = 'user-1';
const AUTHOR_ID = 'author-1';

describe('LikesService', () => {
  let service: LikesService;
  let prisma: PrismaMocks;

  beforeEach(async () => {
    prisma = {
      blog: {
        findUnique: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue({ id: 'blog-1', authorId: AUTHOR_ID }),
        update: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
      },
      like: {
        findUnique: jest
          .fn<Promise<unknown>, [unknown]>()
          .mockResolvedValue(null),
        create: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
        delete: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
      },
      // The real client runs the array atomically; awaiting it is enough here,
      // since every assertion is about what was handed to it.
      $transaction: jest
        .fn<Promise<unknown[]>, [unknown[]]>()
        .mockImplementation((operations) => Promise.all(operations)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LikesService, { provide: DatabaseService, useValue: prisma }],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  describe('likeBlog', () => {
    it('likes a blog the reader has not liked yet', async () => {
      await expect(service.likeBlog(SLUG, READER_ID)).resolves.toEqual({
        isLiked: true,
      });

      expect(prisma.like.create).toHaveBeenCalledWith({
        data: { blogId: 'blog-1', userId: READER_ID },
      });
    });

    // `blog.likesCount` is denormalised from the `like` rows, so the two must
    // move together or trending sorts on a number that is not true.
    it('increments the denormalised counter in the same transaction', async () => {
      await service.likeBlog(SLUG, READER_ID);

      expect(prisma.blog.update).toHaveBeenCalledWith({
        where: { id: 'blog-1' },
        data: { likesCount: { increment: 1 } },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(2);
    });

    it('never increments the counter when the like is rejected', async () => {
      prisma.like.findUnique.mockResolvedValue({ id: 'like-1' });

      await expect(service.likeBlog(SLUG, READER_ID)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.blog.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a missing blog', async () => {
      prisma.blog.findUnique.mockResolvedValue(null);

      await expect(service.likeBlog(SLUG, READER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    // Its author can open a draft, so the lookup must exclude drafts itself.
    it('looks up published blogs only, so a draft is a 404', async () => {
      await service.likeBlog(SLUG, READER_ID);

      expect(prisma.blog.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: SLUG, isPublished: true } }),
      );
    });

    // A self-like would inflate `_count.likes`, which drives the `most_liked`
    // sort and the trending panel.
    it('rejects the author liking their own blog', async () => {
      await expect(service.likeBlog(SLUG, AUTHOR_ID)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.like.create).not.toHaveBeenCalled();
    });

    // The author check has to run before this one, or the message would leak
    // that the row exists.
    it('rejects a second like from the same reader', async () => {
      prisma.like.findUnique.mockResolvedValue({ id: 'like-1' });

      await expect(service.likeBlog(SLUG, READER_ID)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.like.create).not.toHaveBeenCalled();
    });
  });

  describe('unlikeBlog', () => {
    it('removes an existing like', async () => {
      prisma.like.findUnique.mockResolvedValue({ id: 'like-1' });

      await expect(service.unlikeBlog(SLUG, READER_ID)).resolves.toEqual({
        isLiked: false,
      });

      expect(prisma.like.delete).toHaveBeenCalledWith({
        where: { id: 'like-1' },
      });
    });

    it('decrements the denormalised counter in the same transaction', async () => {
      prisma.like.findUnique.mockResolvedValue({ id: 'like-1' });

      await service.unlikeBlog(SLUG, READER_ID);

      expect(prisma.blog.update).toHaveBeenCalledWith({
        where: { id: 'blog-1' },
        data: { likesCount: { decrement: 1 } },
      });
      expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(2);
    });

    it('never decrements the counter when the unlike is rejected', async () => {
      await expect(service.unlikeBlog(SLUG, READER_ID)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.blog.update).not.toHaveBeenCalled();
    });

    // The self-like rule is on `likeBlog` only, so rows created before it
    // landed can still be cleared.
    it('lets the author remove a like predating the self-like rule', async () => {
      prisma.like.findUnique.mockResolvedValue({ id: 'like-1' });

      await expect(service.unlikeBlog(SLUG, AUTHOR_ID)).resolves.toEqual({
        isLiked: false,
      });
    });

    it('rejects unliking a blog the reader has not liked', async () => {
      await expect(service.unlikeBlog(SLUG, READER_ID)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.like.delete).not.toHaveBeenCalled();
    });
  });
});
