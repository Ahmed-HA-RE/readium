import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class NotificationQueryDto {
  @IsUUID('4')
  @IsOptional()
  @IsNotEmpty()
  cursor?: string;
}
