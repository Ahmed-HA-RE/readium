import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../lib/auth';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule.forRoot({ auth }),
  ],
})
export class AppModule {}
