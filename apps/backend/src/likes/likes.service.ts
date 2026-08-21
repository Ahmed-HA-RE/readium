import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: DatabaseService) {}

  private readonly logger = new Logger(LikesService.name);

  private async findBlogBySlug(blogSlug: string): Promise<{ id: string }> {
    const blog = await this.prisma.blog.findUnique({
      where: { slug: blogSlug },
      select: { id: true },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug ${blogSlug} does not exist`);
    }

    return blog;
  }

  private async findLikeByUserAndBlog(
    userId: string,
    blogId: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.like.findUnique({
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
  }

  async likeBlog(
    blogSlug: string,
    userId: string,
  ): Promise<{ isLiked: boolean }> {
    this.logger.verbose(`User ${userId} is liking blog ${blogSlug}`);

    // Check if the blog exists
    const blogExists = await this.findBlogBySlug(blogSlug);

    // Check if the user has already liked the blog
    const existingLike = await this.findLikeByUserAndBlog(
      userId,
      blogExists.id,
    );

    if (existingLike) {
      this.logger.verbose(`User ${userId} has already liked blog ${blogSlug}`);
      throw new BadRequestException(`You have already liked this blog`);
    }

    // Like the blog
    await this.prisma.like.create({
      data: {
        blogId: blogExists.id,
        userId,
      },
    });

    return { isLiked: true };
  }

  async unlikeBlog(
    blogSlug: string,
    userId: string,
  ): Promise<{ isLiked: boolean }> {
    this.logger.verbose(`User ${userId} is unliking blog ${blogSlug}`);

    const blog = await this.findBlogBySlug(blogSlug);

    // Check if the user has liked the blog
    const existingLike = await this.findLikeByUserAndBlog(userId, blog.id);

    if (!existingLike) {
      this.logger.verbose(`User ${userId} has not liked blog ${blogSlug}`);
      throw new BadRequestException(`You have not liked this blog`);
    }

    // Unlike the blog
    await this.prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });

    return { isLiked: false };
  }
}
