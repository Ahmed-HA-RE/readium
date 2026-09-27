import {
  Body,
  Controller,
  Delete,
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
import { AdminService } from './admin.service';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { UpdateAdminDto } from './dto/update-admin-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { minutes, Throttle } from '@nestjs/throttler';
import { UpdateBlogDto } from '../blogs/dto/update-blog-dto';
import { AdminMyBlogsQueryDto } from './dto/admin-my-blogs-query-dto';
import { CommentQueryDto } from '../comments/dto/comment-query-dto';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Method           GET /api/admin/analytics
  // Description     Get the admin dashboard analytics
  @Get('analytics')
  @Roles(['admin'])
  getDashboardAnalytics() {
    return this.adminService.getDashboardAnalytics();
  }

  // Method           GET /api/admin/me
  // Description     Get the signed-in admin's own profile with their counts
  @Get('me')
  @Roles(['admin'])
  getMyDataAsAdmin(@Session() session: UserSession) {
    return this.adminService.getMyDataAsAdmin(session.user);
  }

  // Method           GET /api/admin/me/blogs
  // Description     Get the signed-in admin's published or draft blogs (draft by default), filtered, sorted, and paginated
  @Get('me/blogs')
  @Roles(['admin'])
  getMyBlogsAsAdmin(
    @Session() session: UserSession,
    @Query() query: AdminMyBlogsQueryDto,
  ) {
    return this.adminService.getMyBlogsAsAdmin(session.user, query);
  }

  // Method           GET /api/admin/me/comments
  // Description     Get the signed-in admin's comments with cursor-based pagination
  @Get('me/comments')
  @Roles(['admin'])
  getMyCommentsAsAdmin(
    @Session() session: UserSession,
    @Query() query: CommentQueryDto,
  ) {
    return this.adminService.getMyCommentsAsAdmin(session.user, query);
  }

  // Method           PUT /api/admin/me/blogs/:slug
  // Description     Update one of the signed-in admin's own blogs
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @Put('me/blogs/:slug')
  @Roles(['admin'])
  @UseInterceptors(FileInterceptor('coverImage'))
  updateMyBlogAsAdmin(
    @Session() session: UserSession,
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
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    return this.adminService.updateMyBlogAsAdmin(
      session.user,
      slug,
      coverImage,
      updateBlogDto,
    );
  }

  // Method           DELETE /api/admin/me/blogs/:slug
  // Description     Delete one of the signed-in admin's own blogs
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @Delete('me/blogs/:slug')
  @Roles(['admin'])
  deleteMyBlogAsAdmin(
    @Session() session: UserSession,
    @Param('slug') slug: string,
  ) {
    return this.adminService.deleteMyBlogAsAdmin(session.user, slug);
  }

  // Method           PUT /api/admin/settings
  // Description     Update admin settings
  @Put('settings')
  @Roles(['admin'])
  @UseInterceptors(FileInterceptor('profileImage'))
  updateAdmin(
    @Body() updateAdminDto: UpdateAdminDto,
    @Session() session: UserSession,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: 'image/(jpg|jpeg|png)',
            errorMessage: 'Only JPG, JPEG, and PNG images are allowed',
          }), // regex for image file types (jpg, jpeg, png) only
        ],
      }),
    )
    profileImage: Express.Multer.File,
  ) {
    const user = session.user;
    return this.adminService.updateAdmin(updateAdminDto, user, profileImage);
  }
}
