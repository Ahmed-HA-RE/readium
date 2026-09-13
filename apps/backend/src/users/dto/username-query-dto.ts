import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Query of `GET /api/users/username-taken`. The length rules mirror
// `UpdateUserDto.name` and the sign-up hook in `lib/auth.ts`, so the check can
// only ever be asked about a name that is itself usable.
export class UsernameQueryDto {
  @IsDefined({ message: 'Username is required' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long' })
  username: string;
}
