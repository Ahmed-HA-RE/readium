import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { BlogQueryDto } from './dto/blog-query-dto';

@Controller('api/blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  // Method           GET /api/blogs
  // Description      Get all blogs with filtering, sorting , and pagination
  @Get()
  @AllowAnonymous()
  getAllBlogs(@Query() query: BlogQueryDto) {
    return this.blogsService.getAllBlogs(query);
  }

  // Method           GET /api/blogs/:slug
  // Description      Get a single blog by slug
  @Get(':slug')
  @AllowAnonymous()
  getBlogBySlug(
    @Param('slug') slug: string,
    @Session() session: UserSession | undefined,
  ) {
    const userId = session?.user?.id;
    return this.blogsService.getBlogBySlug(slug, userId);
  }
}
