import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  imports: [NotificationsModule],
})
export class ReportsModule {}
