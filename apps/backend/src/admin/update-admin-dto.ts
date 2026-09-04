import { OmitType } from '@nestjs/mapped-types';
import { UpdateUserDto } from './users/dto/update-user-dto';

// Admin will contain the same fields as UpdateUserDto except for the 'role' field
export class UpdateAdminDto extends OmitType(UpdateUserDto, [
  'role',
] as const) {}
