import { Controller, Delete, Param, Post, Session } from '@nestjs/common';
import { Roles, type UserSession } from '@thallesp/nestjs-better-auth';
import { BookmarksService } from './bookmarks.service';

@Controller('api/blogs/:blogSlug/bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}
  // Method      POST /api/blogs/:blogSlug/bookmarks
  // Description Bookmark a blog post
  @Post()
  @Roles(['user'])
  bookmarkBlog(
    @Param('blogSlug') blogSlug: string,
    @Session() session: UserSession,
  ) {
    const userId = session.user.id;
    return this.bookmarksService.bookmarkBlog(blogSlug, userId);
  }

  // Method      DELETE /api/blogs/:blogSlug/bookmarks
  // Description Remove a bookmark from a blog post
  @Delete()
  @Roles(['user'])
  unBookmarkBlog(
    @Param('blogSlug') blogSlug: string,
    @Session() session: UserSession,
  ) {
    const userId = session.user.id;
    return this.bookmarksService.unBookmarkBlog(blogSlug, userId);
  }
}
