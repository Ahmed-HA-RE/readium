import { Module } from '@nestjs/common';
import { AdminReportsModule } from './reports/admin-reports.module';

@Module({
  imports: [AdminReportsModule],
})
export class AdminModule {}
