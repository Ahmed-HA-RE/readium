import { Controller, Get, Query } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { Roles } from '@thallesp/nestjs-better-auth';
import { UserQueryDto } from './dto/user-query-dto';

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
}
