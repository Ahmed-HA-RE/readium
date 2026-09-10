import { UpdateAdminDto } from '../../admin/dto/update-admin-dto';

// Body of `PUT /api/users/me`: the same `name`, `bio` and `website` rules as
// `UpdateAdminDto`, which is also what keeps `role` out of the writable set.
// The avatar is not a body field — it is the `image` file part.
export class UpdateUserProfileDto extends UpdateAdminDto {}
