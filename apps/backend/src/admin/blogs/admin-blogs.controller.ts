import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { AdminBlogQueryDto } from './dto/admin-blog-query-dto';
import { AdminBlogsService } from './admin-blogs.service';
import { Roles } from '@thallesp/nestjs-better-auth';
import { UpdateBlogStatusDto } from './dto/update-blog-status-dto';

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

  // Method         PUT /api/admin/blogs/:blogSlug/status
  // Description    Update the status of a blog (publish/unpublish) by its slug
  // Access         Private (Admin only)
  @Put(':blogSlug/status')
  @Roles(['admin'])
  updateBlogStatus(
    @Param('blogSlug') blogSlug: string,
    @Body() updateBlogStatusDto: UpdateBlogStatusDto,
  ) {
    return this.adminBlogsService.updateBlogStatus(
      blogSlug,
      updateBlogStatusDto,
    );
  }

  // Method         DELETE /api/admin/blogs/:blogSlug
  // Description    Delete a blog by its slug
  // Access         Private (Admin only)
  @Delete(':blogSlug')
  @Roles(['admin'])
  deleteBlog(@Param('blogSlug') blogSlug: string) {
    return this.adminBlogsService.deleteBlogAsAdmin(blogSlug);
  }
}
