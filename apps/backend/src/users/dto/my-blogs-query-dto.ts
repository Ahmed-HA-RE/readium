import { IsEnum } from 'class-validator';
import { UserBlogsQueryDto } from './user-blogs-query-dto';

export enum MyBlogsStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
}

// Each tab of `/me/stories` asks for one side, so `status` is required: a
// missing or unknown value is a 400, not a silent fallback to both.
export class MyBlogsQueryDto extends UserBlogsQueryDto {
  @IsEnum(MyBlogsStatus)
  status: MyBlogsStatus;
}
