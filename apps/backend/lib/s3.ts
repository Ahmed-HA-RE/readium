import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

/**
 * Deletes one of a user's S3 objects (their avatar or a blog cover) after Better Auth deletes the account.
 *
 * The database cascades every row from `User`, but S3 files are not rows, so without this
 * they would be orphaned in the bucket forever. `lib/auth.ts` lives outside Nest's dependency
 * injection, so it cannot use `S3ServiceService`; this module builds its own client from the
 * same env vars, the way `auth.ts` builds its own `PrismaClient`. It runs after the account
 * is already gone, so failures are logged and never thrown: the user cannot act on them.
 */
export const deleteS3Object = async (key: string): Promise<void> => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      }),
    );
  } catch (error) {
    console.error(`Failed to delete the S3 object ${key}`, error);
  }
};
