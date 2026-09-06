import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { UpdateAdminDto } from './update-admin-dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
