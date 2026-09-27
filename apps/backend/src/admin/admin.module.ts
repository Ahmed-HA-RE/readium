import { Module } from '@nestjs/common';
import { AdminReportsModule } from './reports/admin-reports.module';
import { AdminBlogsModule } from './blogs/admin-blogs.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { S3ServiceModule } from '../s3-service/s3-service.module';
import { UsersModule } from '../users/users.module';
import { BlogsModule } from '../blogs/blogs.module';

@Module({
  imports: [
    AdminReportsModule,
    AdminBlogsModule,
    AdminUsersModule,
    S3ServiceModule,
    UsersModule,
    BlogsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
