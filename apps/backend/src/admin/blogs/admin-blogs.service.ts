import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AdminBlogQueryDto, AdminBlogStatus } from './dto/admin-blog-query-dto';
import { Prisma } from '../../generated/prisma/client';
import { GetAllBlogsForAdmin, GetBlogBySlugForAdmin } from '@repo/types';
import { UpdateBlogStatusDto } from './dto/update-blog-status-dto';
import { S3ServiceService } from '../../s3-service/s3-service.service';

@Injectable()
export class AdminBlogsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
  ) {}

  private logger = new Logger(AdminBlogsService.name);

  async getAllBlogsAsAdmin(
    query: AdminBlogQueryDto,
  ): Promise<GetAllBlogsForAdmin> {
    const { search, status, page, limit } = query;

    // Build the search filter based on the provided query parameters. (Admin will be able to search by title and author name)
    const searchFilter: Prisma.BlogWhereInput = search
      ? {
          OR: [
            {
              title: { contains: search, mode: 'insensitive' },
            },
            {
              author: { name: { contains: search, mode: 'insensitive' } },
            },
          ],
        }
      : {};

    // Build the status filter based on the provided query parameters.
    const statusFilter: Prisma.BlogWhereInput = status
      ? {
          isPublished: status === AdminBlogStatus.PUBLISHED ? true : false,
        }
      : {};

    const whereFilter: Prisma.BlogWhereInput = {
      ...searchFilter,
      ...statusFilter,
    };

    const pageValue = page ? page : 1;
    const limitValue = limit ? limit : 10;

    const blogs = await this.prisma.blog.findMany({
      where: whereFilter,

      orderBy: {
        createdAt: 'desc',
      },
      skip: (pageValue - 1) * limitValue,
      take: limitValue,
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        createdAt: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalBlogs = await this.prisma.blog.count({
      where: whereFilter,
    });
    const totalPages = Math.ceil(totalBlogs / limitValue);

    return {
      blogs,
      totalPages,
    };
  }

  async getBlogBySlugAsAdmin(blogSlug: string): Promise<GetBlogBySlugForAdmin> {
    const blog = await this.prisma.blog.findUnique({
      where: { slug: blogSlug },
      include: {
        _count: {
          select: {
            bookmarks: true,
            likes: true,
            comments: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            banned: true,
            role: true,
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug ${blogSlug} does not exist.`);
    }

    return {
      blog,
    };
  }

  async updateBlogStatus(
    blogSlug: string,
    updateBlogStatusDto: UpdateBlogStatusDto,
  ): Promise<{ isPublished: boolean }> {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { slug: blogSlug },
    });

    if (!existingBlog) {
      throw new NotFoundException(`Blog with slug ${blogSlug} does not exist.`);
    }
    const { isPublished } = updateBlogStatusDto;

    this.logger.log(
      `Updating blog status for slug: ${blogSlug} to isPublished: ${isPublished}`,
    );

    const updatedBlogStatus = await this.prisma.blog.update({
      where: { slug: blogSlug },
      data: { isPublished },
      select: {
        isPublished: true,
      },
    });
    return updatedBlogStatus;
  }

  async deleteBlogAsAdmin(slug: string): Promise<void> {
    this.logger.verbose(`Deleting blog with slug: ${slug}`);

    // Check if there's a blog for the given slug
    const existingBlog = await this.prisma.blog.findUnique({
      where: { slug },
      select: {
        coverImage: true,
      },
    });

    if (!existingBlog) {
      throw new NotFoundException(`Blog with slug ${slug} not found`);
    }

    // Delete the blog from the database
    await this.prisma.blog.delete({
      where: { slug },
    });

    this.logger.verbose(`Blog with slug: ${slug} deleted successfully`);

    // Delete the cover image from S3 if it exists
    if (existingBlog.coverImage) {
      await this.s3Service.deleteFile(existingBlog.coverImage);
    }
  }
}
