import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BlogQueryDto } from './dto/blog-query-dto';
import { Blog, GetAllBlogsResponse, GetBlogBySlugResponse } from '@repo/types';
import { CreateBlogDto } from './dto/create-blog-dto';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { UpdateBlogDto } from './dto/update-blog-dto';
import { generateImageKey, generateSlug } from '../../lib/utils';
import { buildBlogQuery } from './utils/blog-query';

@Injectable()
export class BlogsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
  ) {}

  private logger = new Logger(BlogsService.name);

  async getAllBlogs(
    query: BlogQueryDto,
    userId?: string,
  ): Promise<GetAllBlogsResponse> {
    const { search, sort, page, limit } = query;

    this.logger.verbose('Fetching all blogs with query parameters', {
      search,
      sort,
      page,
      limit,
    });

    const { queryFilter, querySort, limitValue, pageValue } = buildBlogQuery(
      search,
      sort,
      page,
      limit,
    );

    const blogs = await this.prisma.blog.findMany({
      where: {
        ...queryFilter,
        isPublished: true,
      },
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
        ...(userId
          ? {
              likes: {
                where: {
                  userId,
                },
                select: {
                  userId: true,
                },
              },
              bookmarks: {
                where: {
                  userId,
                },
                select: {
                  userId: true,
                },
              },
              report: {
                where: {
                  userId,
                },
                select: {
                  userId: true,
                },
              },
            }
          : {}),
        _count: {
          select: {
            bookmarks: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    const totalBlogs = await this.prisma.blog.count({
      where: {
        ...queryFilter,
        isPublished: true,
      },
    });

    const totalPages = Math.ceil(totalBlogs / limitValue);

    const blogsWithPresignedUrls = blogs.map(async (blog) => {
      const presignedUrl = blog.coverImage
        ? await this.s3Service.getSignedUrl(blog.coverImage)
        : null;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { likes, bookmarks, report, ...blogData } = blog; // Purpose of this line is to remove the likes, bookmarks, and report properties from the blog object so that they don't get sent to the client. These properties are only used to determine if the logged in user has liked, bookmarked, or reported the blog.

      const isLikedByLoggedInUser = blog.likes?.length > 0 ? true : false;
      const isBookmarkedByLoggedInUser = userId
        ? blog.bookmarks.length > 0
        : false;
      const isReportedByLoggedInUser = blog.report?.length > 0 ? true : false;

      return {
        ...blogData,
        isLikedByLoggedInUser,
        isBookmarkedByLoggedInUser,
        isReportedByLoggedInUser,
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
      where: { slug, isPublished: true },
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

        ...(userId
          ? {
              likes: {
                where: {
                  userId,
                },
                select: {
                  userId: true,
                },
              },
              bookmarks: {
                where: {
                  userId,
                },
                select: {
                  userId: true,
                },
              },
              report: {
                where: {
                  userId,
                },
                select: {
                  userId: true,
                },
              },
            }
          : {}),
      },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug ${slug} not found`);
    }

    const isLikedByLoggedInUser = userId ? blog.likes.length > 0 : false;
    const isBookmarkedByLoggedInUser = userId
      ? blog.bookmarks.length > 0
      : false;
    const isReportedByLoggedInUser = userId ? blog.report?.length > 0 : false;

    const presignedUrl = blog.coverImage
      ? await this.s3Service.getSignedUrl(blog.coverImage)
      : null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { likes, bookmarks, report, ...blogData } = blog; // Purpose of this line is to remove the likes, bookmarks, and report properties from the blog object so that they don't get sent to the client. These properties are only used to determine if the logged in user has liked, bookmarked, or reported the blog.

    return {
      blog: {
        ...blogData,
        coverImage: presignedUrl,
      },
      isLikedByLoggedInUser,
      isBookmarkedByLoggedInUser,
      isReportedByLoggedInUser,
    };
  }

  async createBlog(
    coverImage: Express.Multer.File | undefined,
    newBlogData: CreateBlogDto,
    userId: string,
  ): Promise<{ success: boolean; data: Omit<Blog, '_count'> }> {
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
    );

    return { success: true, data: newBlog };
  }

  async updateBlog(
    slug: string,
    coverImage: Express.Multer.File | undefined,
    updateBlogData: UpdateBlogDto,
    userId: string,
  ): Promise<{ success: boolean; data: Omit<Blog, '_count'> }> {
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
