import {
  Controller,
  Get,
  Put,
  Query,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { UserQueryDto } from './dto/user-query-dto';
import { UpdateUserDto } from './dto/update-user-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlogQueryDto } from '../../blogs/dto/blog-query-dto';
import { CommentQueryDto } from '../../comments/dto/comment-query-dto';

@Controller('api/admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // Method       GET /api/admin/users
  // Description  Get all users with filtering and pagination
  @Get()
  @Roles(['admin'])
  getAllUsersAsAdmin(@Query() query: UserQueryDto) {
    return this.adminUsersService.getAllUsersAsAdmin(query);
  }

  // Method       GET /api/admin/users/:username
  // Description  Get a user by username
  @Get(':username')
  @Roles(['admin'])
  getUserByUsername(@Param('username') username: string) {
    return this.adminUsersService.getUserByUsername(username);
  }

  // Method       PUT /api/admin/users/:username
  // Description  Update a user
  @Put(':username')
  @Roles(['admin'])
  @UseInterceptors(FileInterceptor('profileImage'))
  updateUser(
    @Param('username') username: string,
    @Body() updateUserDto: UpdateUserDto,
    @Session() session: UserSession,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            errorMessage: 'Max file size is 5MB',
          }), // 5MB
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
    return this.adminUsersService.updateUser(
      username,
      updateUserDto,
      user,
      profileImage,
    );
  }

  // Method       GET /api/admin/users/:username/blogs
  // Description  Get a user's blogs as an admin with filtering and pagination
  @Get(':username/blogs')
  @Roles(['admin'])
  getUserBlogsByUsername(
    @Param('username') username: string,
    @Query() query: BlogQueryDto,
  ) {
    return this.adminUsersService.getUserBlogsByUsernameAsAdmin(
      username,
      query,
    );
  }

  // Method       GET /api/admin/users/:username/comments
  // Description  Get a user's comments as an admin with cursor-based pagination
  @Get(':username/comments')
  @Roles(['admin'])
  getUserCommentsByUsernameAsAdmin(
    @Param('username') username: string,
    @Query() query: CommentQueryDto,
  ) {
    return this.adminUsersService.getUserCommentsByUsernameAsAdmin(
      username,
      query,
    );
  }
}
