import { Module } from '@nestjs/common';
import { AdminBlogsController } from './admin-blogs.controller';
import { AdminBlogsService } from './admin-blogs.service';
import { S3ServiceService } from '../../s3-service/s3-service.service';

@Module({
  controllers: [AdminBlogsController],
  providers: [AdminBlogsService, S3ServiceService],
})
export class AdminBlogsModule {}
