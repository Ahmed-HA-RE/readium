import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { S3ServiceModule } from '../s3-service/s3-service.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [S3ServiceModule],
})
export class UsersModule {}
