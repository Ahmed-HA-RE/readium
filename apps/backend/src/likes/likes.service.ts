import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private readonly logger = new Logger(LikesService.name);

  private async findBlogBySlug(
    blogSlug: string,
  ): Promise<{ id: string; authorId: string }> {
    // A draft answers 404: only its author can see it, and it is not likeable.
    const blog = await this.prisma.blog.findUnique({
      where: { slug: blogSlug, isPublished: true },
      select: { id: true, authorId: true },
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

    if (blogExists.authorId === userId) {
      throw new BadRequestException(`You cannot like your own blog`);
    }

    // Check if the user has already liked the blog
    const existingLike = await this.findLikeByUserAndBlog(
      userId,
      blogExists.id,
    );

    if (existingLike) {
      this.logger.verbose(`User ${userId} has already liked blog ${blogSlug}`);
      throw new BadRequestException(`You have already liked this blog`);
    }

    // One transaction, or `blog.likesCount` drifts from the rows it is
    // denormalised from the moment either statement fails on its own.
    await this.prisma.$transaction([
      this.prisma.like.create({
        data: {
          blogId: blogExists.id,
          userId,
        },
      }),
      this.prisma.blog.update({
        where: { id: blogExists.id },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    await this.notificationsService.createLikeNotification(
      userId,
      blogExists.authorId,
      blogExists.id,
    );

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

    // Same transaction requirement as `likeBlog`.
    await this.prisma.$transaction([
      this.prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      }),
      this.prisma.blog.update({
        where: { id: blog.id },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    await this.notificationsService.deleteLikeNotification(
      userId,
      blog.authorId,
      blog.id,
    );

    return { isLiked: false };
  }
}
