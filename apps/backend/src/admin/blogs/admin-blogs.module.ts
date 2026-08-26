import { Module } from '@nestjs/common';
import { AdminBlogsController } from './admin-blogs.controller';
import { AdminBlogsService } from './admin-blogs.service';
import { S3ServiceModule } from '../../s3-service/s3-service.module';

@Module({
  controllers: [AdminBlogsController],
  providers: [AdminBlogsService],
  imports: [S3ServiceModule],
})
export class AdminBlogsModule {}
