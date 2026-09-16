import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { S3ServiceModule } from '../s3-service/s3-service.module';

@Module({
  controllers: [SearchController],
  providers: [SearchService],
  imports: [S3ServiceModule],
})
export class SearchModule {}
