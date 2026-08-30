import { Module } from '@nestjs/common';
import { AdminReportsModule } from './reports/admin-reports.module';
import { AdminBlogsModule } from './blogs/admin-blogs.module';
import { AdminUsersModule } from './users/admin-users.module';

@Module({
  imports: [AdminReportsModule, AdminBlogsModule, AdminUsersModule],
})
export class AdminModule {}
