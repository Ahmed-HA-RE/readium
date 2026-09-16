import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3ServiceService } from './s3-service.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed/url'),
}));

const presigner = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

describe('S3ServiceService', () => {
  let service: S3ServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3ServiceService,
        { provide: ConfigService, useValue: { getOrThrow: () => 'test' } },
      ],
    }).compile();

    service = module.get<S3ServiceService>(S3ServiceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSignedUrl', () => {
    it('signs a stored S3 key', async () => {
      await expect(service.getSignedUrl('avatars/abc.png')).resolves.toBe(
        'https://signed/url',
      );
      expect(presigner).toHaveBeenCalled();
    });

    // OAuth sign-ups put the provider's avatar URL in `User.image`. Signing it
    // would treat the whole URL as an object key and 403 on every read.
    it.each([
      'https://lh3.googleusercontent.com/a/ACg8oc',
      'https://avatars.githubusercontent.com/u/12345',
      'http://example.com/avatar.png',
    ])('returns %s untouched', async (url) => {
      await expect(service.getSignedUrl(url)).resolves.toBe(url);
      expect(presigner).not.toHaveBeenCalled();
    });
  });
});
