import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
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
import { AdminSuggestionsQueryDto } from './dto/admin-suggestions-query-dto';

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

  // Method           GET /api/admin/suggestions
  // Description     Get the latest 5 users whose name matches the search term, for the admin header search
  @Get('suggestions')
  @Roles(['admin'])
  getSuggestions(@Query() query: AdminSuggestionsQueryDto) {
    return this.adminService.getSuggestions(query);
  }

  // Method           GET /api/admin/me
  // Description     Get the signed-in admin's own profile with their counts
  @Get('me')
  @Roles(['admin'])
  getMyDataAsAdmin(@Session() session: UserSession) {
    return this.adminService.getMyDataAsAdmin(session.user);
  }

  // Method           PUT /api/admin/settings
  // Description     Update admin settings
  @Put('settings')
  @Roles(['admin'])
  @UseInterceptors(FileInterceptor('image'))
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
    image: Express.Multer.File,
  ) {
    const user = session.user;
    return this.adminService.updateAdmin(updateAdminDto, user, image);
  }
}
