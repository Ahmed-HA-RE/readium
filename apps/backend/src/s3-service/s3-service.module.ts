import { Module } from '@nestjs/common';
import { S3ServiceService } from './s3-service.service';

@Module({
  providers: [S3ServiceService],
  exports: [S3ServiceService],
})
export class S3ServiceModule {}
