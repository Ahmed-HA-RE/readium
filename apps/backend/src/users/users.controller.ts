import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  AllowAnonymous,
  Roles,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { FileInterceptor } from '@nestjs/platform-express';
import { minutes, Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UserBlogsQueryDto } from './dto/user-blogs-query-dto';
import { CommentQueryDto } from '../comments/dto/comment-query-dto';
import { LikesAndBookmarksQueryDto } from './dto/likes-and-bookmarks-query-dto';
import { UpdateUserProfileDto } from './dto/update-user-profile-dto';

const MAX_AVATAR_SIZE_IN_BYTES = 1024 * 1024; // 1MB

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // The `me` routes must stay above `:username`: Nest matches in declaration
  // order, so `:username` first would swallow `/api/users/me`.

  // Method           GET /api/users/me
  // Description      Get the signed-in user's own profile for the dashboard sidebar
  @Get('me')
  @Roles(['user'])
  getCurrentLoggedInUser(@Session() session: UserSession) {
    return this.usersService.getCurrentLoggedInUser(session);
  }

  // Method           GET /api/users/me/blogs
  // Description      Get the signed-in user's own blogs, filtered, sorted, and paginated
  @Get('me/blogs')
  @Roles(['user'])
  getMyBlogs(
    @Session() session: UserSession,
    @Query() query: UserBlogsQueryDto,
  ) {
    return this.usersService.getMyBlogs(session.user, query);
  }

  // Method           GET /api/users/me/blogs/:slug
  // Description      Get one of the signed-in user's own blogs, draft or published, for the editor
  @Get('me/blogs/:slug')
  @Roles(['user'])
  getMyBlogBySlug(
    @Session() session: UserSession,
    @Param('slug') slug: string,
  ) {
    return this.usersService.getMyBlogBySlug(session.user, slug);
  }

  // Method           GET /api/users/me/comments
  // Description      Get the signed-in user's own comments, cursor-paginated
  @Get('me/comments')
  @Roles(['user'])
  getMyComments(
    @Session() session: UserSession,
    @Query() query: CommentQueryDto,
  ) {
    return this.usersService.getMyComments(session.user, query);
  }

  // Method           GET /api/users/me/likes
  // Description      Get the blogs the signed-in user has liked, paginated
  @Get('me/likes')
  @Roles(['user'])
  getMyLikes(
    @Session() session: UserSession,
    @Query() query: LikesAndBookmarksQueryDto,
  ) {
    return this.usersService.getMyLikes(session.user, query);
  }

  // Method           GET /api/users/me/bookmarks
  // Description      Get the blogs the signed-in user has bookmarked, paginated
  @Get('me/bookmarks')
  @Roles(['user'])
  getMyBookmarks(
    @Session() session: UserSession,
    @Query() query: LikesAndBookmarksQueryDto,
  ) {
    return this.usersService.getMyBookmarks(session.user, query);
  }

  // Method           PUT /api/users/me
  // Description      Update the signed-in user's own name, bio, website and avatar
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @Put('me')
  @Roles(['user'])
  @UseInterceptors(FileInterceptor('image'))
  updateUserProfile(
    @Session() session: UserSession,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @UploadedFile(
      new ParseFilePipe({
        // The avatar is optional: a user editing only their bio sends no file.
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_AVATAR_SIZE_IN_BYTES }),
          new FileTypeValidator({
            fileType: 'image/(png|jpeg|jpg|avif)',
            errorMessage: 'Only PNG, JPEG, JPG, and AVIF images are allowed',
          }),
        ],
      }),
    )
    image?: Express.Multer.File,
  ) {
    return this.usersService.updateUserProfile(
      session.user,
      updateUserProfileDto,
      image,
    );
  }

  // Method           GET /api/users/:username
  // Description      Get a user's public profile with their published blogs, filtered, sorted, and paginated
  @Get(':username')
  @AllowAnonymous()
  getUserProfileWithBlogs(
    @Param('username') username: string,
    @Query() query: UserBlogsQueryDto,
  ) {
    return this.usersService.getUserProfileWithBlogs(username, query);
  }
}
