import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { CommentQueryDto } from './dto/comment-query-dto';
import { CreateCommentDto } from './dto/create-comment-dto';

@Controller('api/blogs/:blogSlug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Method      GET /api/blogs/:blogSlug/comments
  // Description Get all comments with cursor pagination for a blog post
  @Get()
  @AllowAnonymous()
  getComments(
    @Query() query: CommentQueryDto,
    @Param('blogSlug') blogSlug: string,
  ) {
    return this.commentsService.getCommentsForBlog(query, blogSlug);
  }

  // Method      POST /api/blogs/:blogSlug/comments
  // Description Create a new comment for a blog post
  @Post()
  createComment(
    @Body() createCommentDto: CreateCommentDto,
    @Param('blogSlug') blogSlug: string,
    @Session() session: UserSession,
  ) {
    const authorId = session.user.id;
    return this.commentsService.createComment(
      createCommentDto,
      blogSlug,
      authorId,
    );
  }
}
