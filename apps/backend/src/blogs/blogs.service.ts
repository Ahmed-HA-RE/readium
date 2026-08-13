import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BlogQueryDto, BlogSortOptions } from './dto/blog-query-dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: DatabaseService) {}

  async getAllBlogs(query: BlogQueryDto) {
    const { search, sort, page, limit } = query;

    const limitValue = limit ? Number(limit) : 10;
    const pageValue = page ? Number(page) : 1;

    // If search query is provided, filter blogs by title or content or author's name
    const queryFilter: Prisma.BlogWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { author: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    // If sort query is provided, sort blogs by the specified option
    const querySort: Prisma.BlogOrderByWithRelationInput = sort
      ? sort === BlogSortOptions.NEWEST
        ? {
            createdAt: 'desc',
          }
        : sort === BlogSortOptions.OLDEST
          ? {
              createdAt: 'asc',
            }
          : {
              likes: {
                _count: 'desc',
              },
            }
      : {
          createdAt: 'desc',
        };

    const blogs = await this.prisma.blog.findMany({
      where: queryFilter,
      orderBy: querySort,
      take: limitValue,
      skip: (pageValue - 1) * limitValue,
    });

    const totalBlogs = await this.prisma.blog.count({
      where: queryFilter,
    });

    const totalPages = Math.ceil(totalBlogs / limitValue);

    return {
      blogs,
      totalPages,
    };
  }
}
