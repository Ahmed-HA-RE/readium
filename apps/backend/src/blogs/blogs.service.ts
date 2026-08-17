import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BlogQueryDto, BlogSortOptions } from './dto/blog-query-dto';
import { Prisma } from '../generated/prisma/client';
import { Blog, GetAllBlogsResponse, GetBlogBySlugResponse } from '@repo/types';
import { CreateBlogDto } from './dto/create-blog-dto';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { UpdateBlogDto } from './dto/update-blog-dto';
import { generateImageKey, generateSlug } from '../../lib/utils';

@Injectable()
export class BlogsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
  ) {}

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
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    const totalBlogs = await this.prisma.blog.count({
      where: queryFilter,
    });

    const totalPages = Math.ceil(totalBlogs / limitValue);

    const blogsWithPresignedUrls = blogs.map(async (blog) => {
      const presignedUrl = blog.coverImage
        ? await this.s3Service.getSignedUrl(blog.coverImage)
        : null;

      return {
        ...blog,
        coverImage: presignedUrl,
      };
    });

    return {
      blogs: await Promise.all(blogsWithPresignedUrls),
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
            id: true,
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

    const presignedUrl = blog.coverImage
      ? await this.s3Service.getSignedUrl(blog.coverImage)
      : null;

    return {
      blog: {
        ...blog,
        coverImage: presignedUrl,
      },
      isLikedByLoggedInUser,
    };
  }

  async createBlog(
    coverImage: Express.Multer.File | undefined,
    newBlogData: CreateBlogDto,
    userId: string,
  ): Promise<{ success: boolean; data: Blog }> {
    const { title, content, tags, isPublished } = newBlogData;

    // Save the cover image to AWS S3 bucket and save the key in the database so that it can be retrieved later with presigned URL. The key will be in the format of `APP_NAME-userId-uuid-originalFileName` to ensure uniqueness and traceability.
    const imageKey = coverImage
      ? generateImageKey({ userId, fileName: coverImage.originalname })
      : null;

    const slug = generateSlug(title);

    if (coverImage && imageKey) {
      await this.s3Service.uploadFile(coverImage, imageKey);
    }

    const newBlog = await this.prisma.blog.create({
      data: {
        title,
        slug,
        content,
        coverImage: imageKey,
        tags,
        isPublished: isPublished ?? false,
        authorId: userId,
      },
    });

    this.logger.verbose(
      `Created new blog with slug: ${slug} for userId: ${userId}`,
      {
        title,
        tags,
        isPublished: isPublished ?? false,
      },
    );

    return { success: true, data: newBlog };
  }

  async updateBlog(
    slug: string,
    coverImage: Express.Multer.File | undefined,
    updateBlogData: UpdateBlogDto,
    userId: string,
  ): Promise<{ success: boolean; data: Blog }> {
    let imageKey: string | null = null;
    let updatedSlug: string | null = null;

    const existingBlog = await this.prisma.blog.findUnique({
      where: { slug, authorId: userId },
      select: {
        title: true,
        slug: true,
        coverImage: true,
      },
    });

    if (!existingBlog) {
      throw new NotFoundException(`Blog with slug ${slug} not found`);
    }

    if (updateBlogData.title && existingBlog.title !== updateBlogData.title) {
      updatedSlug = generateSlug(updateBlogData.title);
    }
    if (coverImage) {
      imageKey = generateImageKey({
        userId,
        fileName: coverImage.originalname,
      });
      await this.s3Service.uploadFile(coverImage, imageKey);
    }

    const updatedBlog = await this.prisma.blog.update({
      where: { slug: existingBlog.slug, authorId: userId },
      data: {
        ...updateBlogData,
        coverImage: imageKey ?? existingBlog.coverImage,
        slug: updatedSlug ?? slug,
      },
    });

    if (coverImage && existingBlog.coverImage) {
      await this.s3Service.deleteFile(existingBlog.coverImage);
    }

    return {
      success: true,
      data: updatedBlog,
    };
  }

  async deleteBlog(slug: string, userId: string): Promise<void> {
    this.logger.verbose(
      `Deleting blog with slug: ${slug} for userId: ${userId}`,
    );

    // Check if there's a blog for the given slug and userId
    const existingBlog = await this.prisma.blog.findUnique({
      where: { slug, authorId: userId },
      select: {
        coverImage: true,
      },
    });

    if (!existingBlog) {
      throw new NotFoundException(`Blog with slug ${slug} not found`);
    }

    // Delete the blog from the database
    await this.prisma.blog.delete({
      where: { slug, authorId: userId },
    });

    // Delete the cover image from S3 if it exists
    if (existingBlog.coverImage) {
      await this.s3Service.deleteFile(existingBlog.coverImage);
    }
  }
}
