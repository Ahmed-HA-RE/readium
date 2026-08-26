import { IsBoolean, IsDefined } from 'class-validator';

export class UpdateBlogStatusDto {
  @IsDefined({ message: 'Please provide the publication status.' })
  @IsBoolean()
  isPublished: boolean;
}
