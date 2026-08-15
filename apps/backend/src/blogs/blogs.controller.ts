import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
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
import { BlogQueryDto } from './dto/blog-query-dto';
import type { Express } from 'express';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBlogDto } from './dto/create-blog-dto';

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

  // Method           POST /api/blogs
  // Description      Create a new blog
  @Post()
  @UseInterceptors(FileInterceptor('coverImage'))
  createBlog(
    @UploadedFile(
      new ParseFilePipe({
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
}
