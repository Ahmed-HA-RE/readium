import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: DatabaseService) {}

  private readonly logger = new Logger(BookmarksService.name);

  private async findBlogBySlug(blogSlug: string): Promise<{ id: string }> {
    const blog = await this.prisma.blog.findUnique({
      // A draft answers 404, like a blog that does not exist.
      where: {
        slug: blogSlug,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug ${blogSlug} does not exist`);
    }

    return blog;
  }

  private async findBookmarkByUserAndBlog(
    userId: string,
    blogId: string,
  ): Promise<{ id: string } | null> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_blogId: {
          blogId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    return bookmark;
  }

  async bookmarkBlog(
    blogSlug: string,
    userId: string,
  ): Promise<{ isBookmarked: boolean }> {
    this.logger.verbose(`User ${userId} is bookmarking blog: ${blogSlug}`);

    const blog = await this.findBlogBySlug(blogSlug);

    const existingBookmark = await this.findBookmarkByUserAndBlog(
      userId,
      blog.id,
    );

    // Check if the user has already bookmarked the blog
    if (existingBookmark) {
      this.logger.verbose(`User ${userId} has already bookmarked ${blogSlug}`);
      throw new BadRequestException(`You have already bookmarked this blog`);
    }

    // Bookmark the blog
    await this.prisma.bookmark.create({
      data: {
        blogId: blog.id,
        userId,
      },
    });

    return { isBookmarked: true };
  }

  async unBookmarkBlog(
    blogSlug: string,
    userId: string,
  ): Promise<{ isBookmarked: boolean }> {
    this.logger.verbose(`User ${userId} is unbookmarking blog: ${blogSlug}`);

    const blog = await this.findBlogBySlug(blogSlug);

    const existingBookmark = await this.findBookmarkByUserAndBlog(
      userId,
      blog.id,
    );

    // Check if the user has bookmarked the blog
    if (!existingBookmark) {
      this.logger.verbose(`User ${userId} has not bookmarked ${blogSlug}`);
      throw new BadRequestException(`You have not bookmarked this blog`);
    }

    // Remove the bookmark
    await this.prisma.bookmark.delete({
      where: {
        userId_blogId: {
          blogId: blog.id,
          userId,
        },
      },
    });

    return { isBookmarked: false };
  }
}
