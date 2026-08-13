import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BlogQueryDto, BlogSortOptions } from './dto/blog-query-dto';
import { Prisma } from '../generated/prisma/client';
import { GetAllBlogsResponse, GetBlogBySlugResponse } from '@repo/types';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: DatabaseService) {}
  private logger = new Logger(BlogsService.name);

  async getAllBlogs(query: BlogQueryDto): Promise<GetAllBlogsResponse> {
    const { search, sort, page, limit } = query;

    this.logger.verbose('Fetching all blogs with query parameters', {
      search,
      sort,
      page,
      limit,
    });

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
  async getBlogBySlug(
    slug: string,
    userId?: string,
  ): Promise<GetBlogBySlugResponse> {
    this.logger.verbose(
      `Fetching blog with slug: ${slug} for ${userId ? `userId: ${userId}` : 'anonymous user'}`,
    );

    const blog = await this.prisma.blog.findUnique({
      where: { slug },
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
            name: true,
            image: true,
          },
        },
        comments: {
          select: {
            content: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        likes: {
          where: {
            userId,
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug ${slug} not found`);
    }

    const isLikedByLoggedInUser = userId ? blog.likes.length > 0 : false;

    return {
      ...blog,
      isLikedByLoggedInUser,
    };
  }
}
