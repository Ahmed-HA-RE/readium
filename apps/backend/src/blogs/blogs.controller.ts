import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { minutes, Throttle } from '@nestjs/throttler';
import { BlogQueryDto } from './dto/blog-query-dto';
import type { Express } from 'express';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBlogDto } from './dto/create-blog-dto';
import { UpdateBlogDto } from './dto/update-blog-dto';

@Controller('api/blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  // Method           GET /api/blogs
  // Description      Get all blogs with filtering, sorting , and pagination
  @Get()
  @AllowAnonymous()
  getAllBlogs(
    @Query() query: BlogQueryDto,
    @Session() session: UserSession | undefined,
  ) {
    const userId = session?.user?.id;
    return this.blogsService.getAllBlogs(query, userId);
  }

  // Method           GET /api/blogs/trending
  // Description      Get the 5 most-liked blogs, excluding the caller's own

  @Get('trending')
  @AllowAnonymous()
  getTrendingBlogs(@Session() session: UserSession | undefined) {
    const userId = session?.user?.id;
    return this.blogsService.getTrendingBlogs(userId);
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

  // Method           POST /api/blogs
  // Description      Create a new blog
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @Post()
  @UseInterceptors(FileInterceptor('coverImage'))
  createBlog(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: '^image/(jpeg|jpg|png|webp)$',
          }),
        ],
      }),
    )
    coverImage: Express.Multer.File,
    @Body() newBlogData: CreateBlogDto,
    @Session() session: UserSession,
  ) {
    const userId = session.user.id;
    return this.blogsService.createBlog(coverImage, newBlogData, userId);
  }

  // Method           PUT /api/blogs/:slug
  // Description      Update an existing blog
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @Put(':slug')
  @UseInterceptors(FileInterceptor('coverImage'))
  updateBlog(
    @Param('slug') slug: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: '^image/(jpeg|jpg|png|webp)$',
          }),
        ],
      }),
    )
    coverImage: Express.Multer.File,
    @Body() updateBlogData: UpdateBlogDto,
    @Session() session: UserSession,
  ) {
    const userId = session.user.id;
    return this.blogsService.updateBlog(
      slug,
      coverImage,
      updateBlogData,
      userId,
    );
  }

  // Method           DELETE /api/blogs/:slug
  // Description      Delete a blog by slug
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @Delete(':slug')
  deleteBlog(@Param('slug') slug: string, @Session() session: UserSession) {
    const userId = session.user.id;
    return this.blogsService.deleteBlog(slug, userId);
  }
}
