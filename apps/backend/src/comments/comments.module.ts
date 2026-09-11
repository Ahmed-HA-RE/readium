import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { S3ServiceModule } from '../s3-service/s3-service.module';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
  imports: [S3ServiceModule],
})
export class CommentsModule {}
