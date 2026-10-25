import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { S3ServiceModule } from '../s3-service/s3-service.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
  imports: [S3ServiceModule, NotificationsModule],
})
export class CommentsModule {}
