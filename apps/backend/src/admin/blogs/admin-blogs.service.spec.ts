import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminBlogsService } from './admin-blogs.service';
import { DatabaseService } from '../../database/database.service';
import { S3ServiceService } from '../../s3-service/s3-service.service';
import { AdminBlogQueryDto, AdminBlogStatus } from './dto/admin-blog-query-dto';
import { banReportFilter } from '../../reports/utils/report-query';

type PrismaMocks = {
  blog: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

// `updateBlogStatus` reads only the count of resolved ban reports.
const blogWithBanReports = (report: number) => ({ _count: { report } });

describe('AdminBlogsService', () => {
  let service: AdminBlogsService;
  let prisma: PrismaMocks;
  let s3: { getSignedUrl: jest.Mock; deleteFile: jest.Mock };

  beforeEach(async () => {
    prisma = {
      blog: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    s3 = {
      getSignedUrl: jest.fn((key: string) =>
        Promise.resolve(`https://signed/${key}`),
      ),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBlogsService,
        { provide: DatabaseService, useValue: prisma },
        { provide: S3ServiceService, useValue: s3 },
      ],
    }).compile();

    service = module.get<AdminBlogsService>(AdminBlogsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('updateBlogStatus', () => {
    beforeEach(() => {
      prisma.blog.update.mockImplementation(
        ({ data }: { data: { isPublished: boolean } }) =>
          Promise.resolve({ isPublished: data.isPublished }),
      );
    });

    it('counts only resolved ban reports in the lookup', async () => {
      prisma.blog.findUnique.mockResolvedValue(blogWithBanReports(0));

      await service.updateBlogStatus('my-story', { isPublished: true });

      expect(prisma.blog.findUnique).toHaveBeenCalledWith({
        where: { slug: 'my-story' },
        select: { _count: { select: { report: { where: banReportFilter } } } },
      });
    });

    it('throws 404 when the blog does not exist', async () => {
      prisma.blog.findUnique.mockResolvedValue(null);

      await expect(
        service.updateBlogStatus('missing', { isPublished: true }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.blog.update).not.toHaveBeenCalled();
    });

    it('refuses to republish a story taken down with a ban', async () => {
      prisma.blog.findUnique.mockResolvedValue(blogWithBanReports(1));

      await expect(
        service.updateBlogStatus('my-story', { isPublished: true }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.blog.update).not.toHaveBeenCalled();
    });

    it('still lets an admin unpublish a ban-locked story', async () => {
      prisma.blog.findUnique.mockResolvedValue(blogWithBanReports(2));

      const result = await service.updateBlogStatus('my-story', {
        isPublished: false,
      });

      expect(prisma.blog.update).toHaveBeenCalledWith({
        where: { slug: 'my-story' },
        data: { isPublished: false },
        select: { isPublished: true },
      });
      expect(result).toEqual({ isPublished: false });
    });

    it('publishes a story with no ban reports', async () => {
      prisma.blog.findUnique.mockResolvedValue(blogWithBanReports(0));

      const result = await service.updateBlogStatus('my-story', {
        isPublished: true,
      });

      expect(result).toEqual({ isPublished: true });
    });
  });

  describe('getAllBlogsAsAdmin', () => {
    beforeEach(() => {
      prisma.blog.findMany.mockResolvedValue([
        { id: 'blog-1', coverImage: 'cover-key' },
        { id: 'blog-2', coverImage: null },
      ]);
      prisma.blog.count.mockResolvedValue(12);
    });

    const findManyArgs = () =>
      (
        prisma.blog.findMany.mock.calls[0] as [
          { where: unknown; skip: number; take: number },
        ]
      )[0];

    it('filters unpublished blogs and counts with the same filter', async () => {
      await service.getAllBlogsAsAdmin({
        status: AdminBlogStatus.UNPUBLISHED,
      } as AdminBlogQueryDto);

      expect(findManyArgs().where).toEqual({ isPublished: false });
      expect(prisma.blog.count).toHaveBeenCalledWith({
        where: { isPublished: false },
      });
    });

    it('pages with skip and take and derives totalPages from the limit', async () => {
      const { totalPages } = await service.getAllBlogsAsAdmin({
        page: 3,
        limit: 5,
      } as AdminBlogQueryDto);

      expect(findManyArgs()).toMatchObject({ skip: 10, take: 5 });
      expect(totalPages).toBe(3);
    });

    it('signs a cover image and leaves a missing one null', async () => {
      const { blogs } = await service.getAllBlogsAsAdmin(
        {} as AdminBlogQueryDto,
      );

      expect(s3.getSignedUrl).toHaveBeenCalledTimes(1);
      expect(blogs[0].coverImage).toBe('https://signed/cover-key');
      expect(blogs[1].coverImage).toBeNull();
    });
  });

  describe('deleteBlogAsAdmin', () => {
    it('throws 404 when the blog does not exist', async () => {
      prisma.blog.findUnique.mockResolvedValue(null);

      await expect(service.deleteBlogAsAdmin('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.blog.delete).not.toHaveBeenCalled();
    });

    it('deletes the row and then its cover image', async () => {
      prisma.blog.findUnique.mockResolvedValue({ coverImage: 'cover-key' });

      await service.deleteBlogAsAdmin('my-story');

      expect(prisma.blog.delete).toHaveBeenCalledWith({
        where: { slug: 'my-story' },
      });
      expect(s3.deleteFile).toHaveBeenCalledWith('cover-key');
    });

    it('skips S3 when the blog has no cover image', async () => {
      prisma.blog.findUnique.mockResolvedValue({ coverImage: null });

      await service.deleteBlogAsAdmin('my-story');

      expect(s3.deleteFile).not.toHaveBeenCalled();
    });
  });
});
