import { IsEnum, IsNotEmpty } from 'class-validator';

enum CreateReportReason {
  SPAM = 'SPAM',
  RULES_VIOLATION = 'RULES_VIOLATION',
  HARASSMENT = 'HARASSMENT',
  AI_GENERATED = 'AI_GENERATED',
}

export class CreateReportDto {
  @IsNotEmpty()
  @IsEnum(CreateReportReason)
  reason: CreateReportReason;
}
