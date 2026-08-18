import { Injectable } from '@nestjs/common';
import { CommentQueryDto } from './dto/comment-query-dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: DatabaseService) {}

  async getComments(query: CommentQueryDto) {
    const { limit, cursor } = query;

    const take = limit ? parseInt(limit) : 10; // Default limit is 10 if not provided

    const comments = await this.prisma.comment.findMany({
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
        createdAt: 'asc',
      },
    });

    return {
      data: comments,
      nextCursor: comments.length > 0 ? comments[comments.length - 1].id : null,
    };
  }
}
