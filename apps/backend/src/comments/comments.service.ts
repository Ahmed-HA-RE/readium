import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentQueryDto } from './dto/comment-query-dto';
import { DatabaseService } from '../database/database.service';
import { Comment } from '@repo/types';
import { CreateCommentDto } from './dto/create-comment-dto';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { S3ServiceService } from '../s3-service/s3-service.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
  ) {}

  // `author.image` is stored as an S3 key, so every path that returns a comment
  // signs it. Without this the client receives an unrenderable key.
  private async presignAuthorImage<
    T extends { author: { image: string | null } },
  >(comment: T): Promise<T> {
    if (!comment.author.image) return comment;

    return {
      ...comment,
      author: {
        ...comment.author,
        image: await this.s3Service.getSignedUrl(comment.author.image),
      },
    };
  }

  private async findBlogBySlug(blogSlug: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { slug: blogSlug },
      select: { id: true },
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
  ): Promise<{ data: Comment[]; nextCursor: string | null }> {
    const { limit, cursor } = query;

    const take = limit ?? 10; // Default limit is 10 if not provided

    const comments = await this.prisma.comment.findMany({
      where: { blog: { slug: blogSlug } },
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

    return {
      data: await Promise.all(
        comments.map((comment) => this.presignAuthorImage(comment)),
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

    return this.presignAuthorImage(newComment);
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

    return this.presignAuthorImage(updatedComment);
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
