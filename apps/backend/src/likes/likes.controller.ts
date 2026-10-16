import { Controller, Delete, Param, Post } from '@nestjs/common';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { LikesService } from './likes.service';

// Users only: admins act on the community rather than take part in it.
@Controller('api/blogs/:blogSlug/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // Method      POST /api/blogs/:blogSlug/likes
  // Description Like a blog post
  @Post()
  @Roles(['user'])
  likeBlog(
    @Param('blogSlug') blogSlug: string,
    @Session() session: UserSession,
  ) {
    const userId = session.user.id;
    return this.likesService.likeBlog(blogSlug, userId);
  }

  // Method      DELETE /api/blogs/:blogSlug/likes
  // Description Unlike a blog post
  @Delete()
  @Roles(['user'])
  unlikeBlog(
    @Param('blogSlug') blogSlug: string,

    @Session() session: UserSession,
  ) {
    const userId = session.user.id;
    return this.likesService.unlikeBlog(blogSlug, userId);
  }
}
