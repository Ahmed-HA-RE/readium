import { Controller, Get, Query } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
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
}
