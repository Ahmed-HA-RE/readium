import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentQueryDto } from './dto/comment-query-dto';
import { DatabaseService } from '../database/database.service';
import { Comment } from '@repo/types';
import { CreateCommentDto } from './dto/create-comment-dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: DatabaseService) {}

  async getCommentsForBlog(
    query: CommentQueryDto,
    blogSlug: string,
  ): Promise<{ data: Comment[]; nextCursor: string | null }> {
    const { limit, cursor } = query;

    const take = limit ? parseInt(limit) : 10; // Default limit is 10 if not provided

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
      orderBy: {
        createdAt: 'desc',
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

    return {
      data: comments,
      nextCursor: comments.length > 0 ? comments[comments.length - 1].id : null,
    };
  }

  async createComment(
    createCommentDto: CreateCommentDto,
    blogSlug: string,
    authorId: string,
  ): Promise<Comment> {
    const { content } = createCommentDto;

    const blog = await this.prisma.blog.findUnique({
      where: { slug: blogSlug },
      select: { id: true },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with slug ${blogSlug} not found`);
    }

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

    return newComment;
  }
}
