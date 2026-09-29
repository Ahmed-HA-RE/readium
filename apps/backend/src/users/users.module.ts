import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { S3ServiceModule } from '../s3-service/s3-service.module';
import { BlogsModule } from '../blogs/blogs.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  // `BlogsService` builds the profile's blog cards, the same shape as the feed.
  imports: [S3ServiceModule, BlogsModule],
  // Exported for `AdminService`, which reuses `isUsernameTaken`.
  exports: [UsersService],
})
export class UsersModule {}
