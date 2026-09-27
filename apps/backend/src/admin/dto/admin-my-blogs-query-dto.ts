import { IsEnum, IsOptional } from 'class-validator';
import { UserBlogsQueryDto } from '../../users/dto/user-blogs-query-dto';
import { MyBlogsStatus } from '../../users/dto/my-blogs-query-dto';

export class AdminMyBlogsQueryDto extends UserBlogsQueryDto {
  @IsOptional()
  @IsEnum(MyBlogsStatus)
  status: MyBlogsStatus = MyBlogsStatus.DRAFT;
}
