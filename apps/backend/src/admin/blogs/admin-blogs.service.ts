import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AdminBlogQueryDto, AdminBlogStatus } from './dto/admin-blog-query-dto';
import { Prisma } from '../../generated/prisma/client';
import { GetAllBlogsForAdmin } from '@repo/types';

@Injectable()
export class AdminBlogsService {
  constructor(private readonly prisma: DatabaseService) {}

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
}
