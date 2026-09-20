# Update User Profile

## Overview

Allow authenticated users to update their basic profile information. Other account-related fields, such as **password, email, and 2FA**, will be implemented later using **Better Auth** when the user's dashboard is implemented on the frontend.

## Key Features

### Updateable Fields

For now, users can update only the following fields:

- `name`
- `image`
- `bio`
- `website`

Do not allow this endpoint to update any other user fields.

### Image Upload

- Handle the optional `image` upload using:

```ts
@UseInterceptors(FileInterceptor('image'))
```

- Add NestJS's built-in `ParseFilePipe` to validate the uploaded image.

- The `ParseFilePipe` should use:
  - `MaxFileSizeValidator`
  - `FileTypeValidator`

- The maximum image size must be **1 MB**.

- Only allow the following image types:
  - PNG
  - JPEG
  - JPG
  - AVIF

- Use a regular expression with `FileTypeValidator` to restrict the accepted image types to the required formats.

- Image upload must be **optional** because the user does not have to change their profile image.

For implementation details, refer to the NestJS file upload documentation:

- `https://docs.nestjs.com/techniques/file-upload#file-upload`

### Update User DTO

Create:

```text
UpdateUserProfileDto
```

The DTO should extend the existing `UpdateAdminDto` because it uses the **same fields and validation rules**.

Do not add fields that are not already supported by `UpdateAdminDto`.

### S3 Image Handling

When a new image is uploaded:

1. Use the existing `generateImageKey` function imported from:

```text
/apps/backend/lib/utils
```

2. Generate a new S3 object key for the uploaded image.
3. Upload the new image to the existing S3 bucket using the existing S3 service.
4. Update the user's database record with the new image key.
5. If the user already has an existing image key in the database, delete the **old image** from the S3 bucket after the new image has been successfully uploaded and the user record has been successfully updated.

Reuse the existing S3 deletion logic from the existing S3 service rather than implementing new deletion logic.

For the overall image upload implementation, use the existing `updateAdmin()` service as the primary reference:

```text
/src/admin/admin-service.ts
```

Follow the existing project's patterns and conventions rather than introducing a different image-upload implementation.

## Reference

- `context/project-overview.md`
- `https://docs.nestjs.com/techniques/file-upload#file-upload`
- `/src/admin/admin-service.ts`
