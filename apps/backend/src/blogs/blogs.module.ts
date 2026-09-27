import { Module } from '@nestjs/common';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { S3ServiceModule } from '../s3-service/s3-service.module';

@Module({
  controllers: [BlogsController],
  providers: [BlogsService],
  imports: [S3ServiceModule],
  exports: [BlogsService],
})
export class BlogsModule {}
