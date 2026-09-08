import { Controller, Get, Param, Query } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { UsersService } from './users.service';
import { UserBlogsQueryDto } from './dto/user-blogs-query-dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
