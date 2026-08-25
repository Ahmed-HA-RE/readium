import { Module } from '@nestjs/common';
import { AdminReportsModule } from './reports/admin-reports.module';
import { AdminBlogsModule } from './blogs/admin-blogs.module';

@Module({
  imports: [AdminReportsModule, AdminBlogsModule],
})
export class AdminModule {}
