import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3ServiceService {
  private s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow('AWS_REGION'),
    });
  }
  async uploadFile(file: Express.Multer.File, key: string): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
      }),
    );
  }

  async getSignedUrl(key: string): Promise<string> {
    // OAuth sign-ups store the provider's avatar URL in `User.image`, not an
    // S3 key. Signing one would make it the object key and 403 on every read.
    if (key.startsWith('http://') || key.startsWith('https://')) return key;

    const command = new GetObjectCommand({
      Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
      Key: key,
    });
    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: 4 * 60 * 60, // 4 hours
    });
    return url;
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Key: key,
      }),
    );
  }
}
