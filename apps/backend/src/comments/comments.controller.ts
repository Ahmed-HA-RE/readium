import { Controller, Get, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CommentQueryDto } from './dto/comment-query-dto';

@Controller('api/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Method      GET /api/comments
  // Description Get all comments with cursor pagination
  @Get()
  @AllowAnonymous()
  getComments(@Query() query: CommentQueryDto) {
    return this.commentsService.getComments(query);
  }
}
