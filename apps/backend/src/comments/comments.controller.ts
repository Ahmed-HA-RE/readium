import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
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

  // Method      PUT /api/blogs/:blogSlug/comments/:commentId
  // Description Update an existing comment for a blog post
  @Put('/:commentId')
  updateComment(
    @Body() updateCommentDto: CreateCommentDto, // We can use CreateCommentDto here since the fields are the same for updating a comment (content is required)
    @Param('blogSlug') blogSlug: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Session() session: UserSession,
  ) {
    const authorId = session.user.id;
    return this.commentsService.updateComment(
      updateCommentDto,
      blogSlug,
      commentId,
      authorId,
    );
  }

  // Method      DELETE /api/blogs/:blogSlug/comments/:commentId
  // Description Delete an existing comment for a blog post
  @Delete('/:commentId')
  deleteComment(
    @Param('blogSlug')
    blogSlug: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Session() session: UserSession,
  ) {
    const user = session.user;
    return this.commentsService.deleteComment(blogSlug, commentId, user);
  }
}
