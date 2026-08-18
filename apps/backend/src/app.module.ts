import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../lib/auth';
import { AppController } from './app.controller';
import { BlogsModule } from './blogs/blogs.module';
import { S3ServiceModule } from './s3-service/s3-service.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule.forRoot({ auth }),
    BlogsModule,
    S3ServiceModule,
    CommentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
