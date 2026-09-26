import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BlogQueryDto } from './dto/blog-query-dto';
import {
  Blog,
  GetAllBlogsResponse,
  GetBlogBySlugResponse,
  GetTrendingBlogsResponse,
  UpdateMyBlogResponse,
} from '@repo/types';
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

    // Hidden from the reporter only. A pending report must not pull a blog out
    // of everyone's feed before a moderator has looked at it.
    const where = {
      ...queryFilter,
      isPublished: true,
      ...(userId ? { report: { none: { userId } } } : {}),
    };

    const blogs = await this.prisma.blog.findMany({
      where,
      orderBy: querySort,
      take: limitValue,
      skip: (pageValue - 1) * limitValue,
      // Cards render `shortDescription`, so the full body never ships in a list.
      omit: { content: true },
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

    const totalBlogs = await this.prisma.blog.count({ where });

    const totalPages = Math.ceil(totalBlogs / limitValue);

    const blogsWithPresignedUrls = blogs.map(async (blog) => {
      const presignedUrl = blog.coverImage
        ? await this.s3Service.getSignedUrl(blog.coverImage)
        : null;

      const authorImage = blog.author.image
        ? await this.s3Service.getSignedUrl(blog.author.image)
        : null;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { likes, bookmarks, ...blogData } = blog; // Purpose of this line is to remove the likes and bookmarks properties from the blog object so that they don't get sent to the client. These properties are only used to determine if the logged in user has liked or bookmarked the blog.

      const isLikedByLoggedInUser = blog.likes?.length > 0 ? true : false;
      const isBookmarkedByLoggedInUser = userId
        ? blog.bookmarks.length > 0
        : false;

      return {
        ...blogData,
        author: { ...blogData.author, image: authorImage },
        isLikedByLoggedInUser,
        isBookmarkedByLoggedInUser,
        coverImage: presignedUrl,
      };
    });

    return {
      blogs: await Promise.all(blogsWithPresignedUrls),
      totalPages,
    };
  }

  // OAuth sign-ups store the provider's avatar URL in `User.image` instead of
  // an S3 key, so it is returned as-is rather than signed.
  private resolveAuthorImage(
    image: string | null,
  ): string | Promise<string> | null {
    if (!image) return null;

    return image.startsWith('http://') || image.startsWith('https://')
      ? image
      : this.s3Service.getSignedUrl(image);
  }

  // The five most-liked published blogs, minus any the caller has reported. A
  // tie on like count goes to the more recently created blog.
  async getTrendingBlogs(userId?: string): Promise<GetTrendingBlogsResponse[]> {
    this.logger.verbose(
      `Fetching trending blogs for ${userId ? `userId: ${userId}` : 'anonymous user'}`,
    );

    const blogs = await this.prisma.blog.findMany({
      where: {
        isPublished: true,
        likesCount: { gt: 0 },
        // Hidden from the reporter only, matching the feed and the search
        // suggestions. A pending report must not pull a blog from everyone.
        ...(userId ? { report: { none: { userId } } } : {}),
      },
      // Served by `@@index([isPublished, likesCount])` — no aggregate, no sort.
      orderBy: [{ likesCount: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: {
        title: true,
        slug: true,
        shortDescription: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return Promise.all(
      blogs.map(async (blog) => ({
        ...blog,
        author: {
          ...blog.author,
          image: await this.resolveAuthorImage(blog.author.image),
        },
      })),
    );
  }

  async getBlogBySlug(
    slug: string,
    userId?: string,
  ): Promise<GetBlogBySlugResponse> {
    this.logger.verbose(
      `Fetching blog with slug: ${slug} for ${userId ? `userId: ${userId}` : 'anonymous user'}`,
    );

    const blog = await this.prisma.blog.findUnique({
      where: {
        slug,
        isPublished: true,
        // Hidden from the reporter only, matching the feed, trending and search.
        ...(userId ? { report: { none: { userId } } } : {}),
      },
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

    const [presignedUrl, authorImage] = await Promise.all([
      blog.coverImage ? this.s3Service.getSignedUrl(blog.coverImage) : null,
      this.resolveAuthorImage(blog.author.image),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { likes, bookmarks, ...blogData } = blog; // Purpose of this line is to remove the likes and bookmarks properties from the blog object so that they don't get sent to the client. These properties are only used to determine if the logged in user has liked or bookmarked the blog.

    return {
      blog: {
        ...blogData,
        author: { ...blogData.author, image: authorImage },
        coverImage: presignedUrl,
      },
      isLikedByLoggedInUser,
      isBookmarkedByLoggedInUser,
    };
  }

  async createBlog(
    coverImage: Express.Multer.File | undefined,
    newBlogData: CreateBlogDto,
    userId: string,
  ): Promise<{ success: boolean; data: Omit<Blog, '_count'> }> {
    const { title, shortDescription, content, tags, isPublished } = newBlogData;

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
        shortDescription,
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
  ): Promise<UpdateMyBlogResponse> {
    let imageKey: string | null = null;
    let updatedSlug: string | null = null;

    const { title, shortDescription, content, tags, isPublished } =
      updateBlogData;

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

    if (title && existingBlog.title !== title) {
      updatedSlug = generateSlug(title);
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
        title,
        shortDescription,
        content,
        tags,
        isPublished,
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
