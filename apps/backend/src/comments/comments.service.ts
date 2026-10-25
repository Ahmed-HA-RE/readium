import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentQueryDto } from './dto/comment-query-dto';
import { DatabaseService } from '../database/database.service';
import { Comment, GetBlogCommentsResponse } from '@repo/types';
import { CreateCommentDto } from './dto/create-comment-dto';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PRO_STATUSES } from '../../lib/constants';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // `author.image` is an S3 key, except for OAuth sign-ups where it is already
  // the provider's URL and signing it would produce a broken link.
  private async presignAuthorImage<
    T extends { author: { image: string | null } },
  >(comment: T): Promise<T> {
    const { image } = comment.author;

    if (!image || image.startsWith('http://') || image.startsWith('https://')) {
      return comment;
    }

    return {
      ...comment,
      author: {
        ...comment.author,
        image: await this.s3Service.getSignedUrl(image),
      },
    };
  }

  // One subscription query per page, never per comment. `referenceId` holds the subscriber's user id.
  private async attachProStatus<T extends { author: { id: string } }>(
    comments: T[],
  ): Promise<(T & { author: T['author'] & { isPro: boolean } })[]> {
    const authorIds = [...new Set(comments.map(({ author }) => author.id))];

    const subscriptions = authorIds.length
      ? await this.prisma.subscription.findMany({
          where: {
            referenceId: { in: authorIds },
            status: { in: PRO_STATUSES },
          },
          select: { referenceId: true },
        })
      : [];

    const proAuthorIds = new Set(
      subscriptions.map(({ referenceId }) => referenceId),
    );

    return comments.map((comment) => ({
      ...comment,
      author: { ...comment.author, isPro: proAuthorIds.has(comment.author.id) },
    }));
  }

  private async findBlogBySlug(blogSlug: string) {
    // A draft answers 404: it has no comment thread.
    const blog = await this.prisma.blog.findUnique({
      where: { slug: blogSlug, isPublished: true },
      select: { id: true, authorId: true },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug ${blogSlug} not found`);
    }

    return blog;
  }

  private async findCommentById(
    commentId: string,
    authorId: string,
    blogId: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId, authorId, blogId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    return comment;
  }

  async getCommentsForBlog(
    query: CommentQueryDto,
    blogSlug: string,
  ): Promise<GetBlogCommentsResponse> {
    const { limit, cursor } = query;

    const take = limit ?? 10; // Default limit is 10 if not provided

    const comments = await this.prisma.comment.findMany({
      where: { blog: { slug: blogSlug, isPublished: true } },
      take,
      ...(cursor
        ? {
            skip: 1,
            cursor: {
              id: cursor,
            },
          }
        : {}),
      // `createdAt` alone while cursoring on `id` leaves ties ambiguous, so
      // pages could skip or repeat a comment. Same fix as the admin feed.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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

    const commentsWithProStatus = await this.attachProStatus(comments);

    return {
      data: await Promise.all(
        commentsWithProStatus.map((comment) =>
          this.presignAuthorImage(comment),
        ),
      ),
      // Only a full page can have more after it; a short page ends the feed.
      nextCursor:
        comments.length === take ? comments[comments.length - 1].id : null,
    };
  }

  async createComment(
    createCommentDto: CreateCommentDto,
    blogSlug: string,
    authorId: string,
  ): Promise<Comment> {
    const { content } = createCommentDto;

    const blog = await this.findBlogBySlug(blogSlug);

    const newComment = await this.prisma.comment.create({
      data: {
        content,
        blogId: blog.id,
        authorId,
      },
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

    const [commentWithProStatus] = await this.attachProStatus([newComment]);

    // Notify the blog author about the new comment
    await this.notificationsService.createCommentNotification(
      newComment.authorId,
      blog.authorId,
      blog.id,
      newComment.id,
    );

    return this.presignAuthorImage(commentWithProStatus);
  }

  async updateComment(
    updateCommentDto: CreateCommentDto,
    blogSlug: string,
    commentId: string,
    authorId: string,
  ): Promise<Comment> {
    const { content } = updateCommentDto; // We can use CreateCommentDto here since the fields are the same for updating a comment (content is required)

    const blog = await this.findBlogBySlug(blogSlug);

    const comment = await this.findCommentById(commentId, authorId, blog.id);

    const updatedComment = await this.prisma.comment.update({
      where: {
        id: comment.id,
      },
      data: { content },
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

    const [commentWithProStatus] = await this.attachProStatus([updatedComment]);

    return this.presignAuthorImage(commentWithProStatus);
  }

  async deleteComment(
    blogSlug: string,
    commentId: string,
    user: Pick<UserSession['user'], 'id' | 'role'>,
  ): Promise<void> {
    const blog = await this.findBlogBySlug(blogSlug);

    // Check if the user is the author of the comment or an admin
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId, blogId: blog.id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    if (comment.authorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException(
        `You do not have permission to delete this comment`,
      );
    }

    await this.prisma.comment.delete({
      where: {
        id: comment.id,
      },
    });
  }
}
