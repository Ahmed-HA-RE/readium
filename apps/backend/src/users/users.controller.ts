import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  AllowAnonymous,
  Roles,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { UsersService } from './users.service';
import { UserBlogsQueryDto } from './dto/user-blogs-query-dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // The `me` routes must stay above `:username`: Nest matches in declaration
  // order, so a `:username` declared first would swallow `/api/users/me` and
  // answer 404 for a user who has no account named "me".

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
