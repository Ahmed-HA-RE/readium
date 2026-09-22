import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LikesService } from './likes.service';
import { DatabaseService } from '../database/database.service';

type PrismaMocks = {
  blog: { findUnique: jest.Mock<Promise<unknown>, [unknown]> };
  like: {
    findUnique: jest.Mock<Promise<unknown>, [unknown]>;
    create: jest.Mock<Promise<unknown>, [unknown]>;
    delete: jest.Mock<Promise<unknown>, [unknown]>;
  };
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
      },
      like: {
        findUnique: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(null),
        create: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
        delete: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
      },
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

    it('rejects a missing blog', async () => {
      prisma.blog.findUnique.mockResolvedValue(null);

      await expect(service.likeBlog(SLUG, READER_ID)).rejects.toThrow(
        NotFoundException,
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
