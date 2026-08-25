import { Controller, Get, Query } from '@nestjs/common';
import { AdminBlogQueryDto } from './dto/admin-blog-query-dto';
import { AdminBlogsService } from './admin-blogs.service';
import { Roles } from '@thallesp/nestjs-better-auth';

@Controller('/api/admin/blogs')
export class AdminBlogsController {
  constructor(private readonly adminBlogsService: AdminBlogsService) {}

  // Method         GET /api/admin/blogs
  // Description    Get all blogs as admin with optional query parameters for search, status, page, and limit
  // Access         Private (Admin only)
  @Get()
  @Roles(['admin'])
  getAllBlogsAsAdmin(@Query() query: AdminBlogQueryDto) {
    return this.adminBlogsService.getAllBlogsAsAdmin(query);
  }
}
