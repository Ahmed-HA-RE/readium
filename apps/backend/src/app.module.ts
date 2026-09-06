import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../lib/auth';
import { AppController } from './app.controller';
import { BlogsModule } from './blogs/blogs.module';
import { S3ServiceModule } from './s3-service/s3-service.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { LastActivityInterceptor } from './common/interceptors/last-activity.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule.forRoot({ auth }),
    BlogsModule,
    S3ServiceModule,
    CommentsModule,
    LikesModule,
    BookmarksModule,
    ReportsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    // Keeps User.lastActivityAt fresh on every authenticated request so the
    // admin dashboard can report active users.
    {
      provide: APP_INTERCEPTOR,
      useClass: LastActivityInterceptor,
    },
  ],
})
export class AppModule {}
