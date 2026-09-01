import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { S3ServiceModule } from '../../s3-service/s3-service.module';

@Module({
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
  imports: [S3ServiceModule],
})
export class AdminUsersModule {}
