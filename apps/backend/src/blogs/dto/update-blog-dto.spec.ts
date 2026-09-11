import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateBlogDto } from './update-blog-dto';
import { CreateBlogDto } from './create-blog-dto';

const metadata = {
  type: 'body' as const,
  metatype: UpdateBlogDto,
};

// A body that only touches fields the DTO declares, plus three columns it does
// not. `authorId` is the dangerous one: it is writable on BlogUncheckedUpdateInput.
const body = () => ({
  title: 'A perfectly legitimate title',
  authorId: 'victim-user-id',
  id: 'forced-id',
  createdAt: '2099-01-01',
});

describe('UpdateBlogDto', () => {
  // Documents *why* `whitelist` is required. This pipe is deliberately
  // configured without it, so it keeps demonstrating the mechanism after
  // main.ts is fixed.
  describe('an unguarded ValidationPipe', () => {
    const unguarded = new ValidationPipe({
      stopAtFirstError: true,
      transform: true,
    });

    it('copies keys the DTO never declares onto the instance', async () => {
      const dto = (await unguarded.transform(body(), metadata)) as Record<
        string,
        unknown
      >;

      expect(Object.keys(dto)).toEqual(
        expect.arrayContaining(['authorId', 'id', 'createdAt']),
      );
      expect(dto.authorId).toBe('victim-user-id');
    });

    // This is the object `updateBlog` spreads into Prisma's `data`.
    it('carries them through a spread into a Prisma update payload', async () => {
      const dto = (await unguarded.transform(body(), metadata)) as Record<
        string,
        unknown
      >;

      const data = { ...dto, coverImage: 'cover-key', slug: 'a-slug' };

      expect(data).toMatchObject({
        authorId: 'victim-user-id',
        id: 'forced-id',
        createdAt: '2099-01-01',
      });
    });
  });

  // The configuration main.ts actually uses.
  describe('the guarded ValidationPipe', () => {
    const guarded = new ValidationPipe({
      stopAtFirstError: true,
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    it('rejects a body carrying undeclared fields', async () => {
      expect.assertions(2);

      try {
        await guarded.transform(body(), metadata);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);

        const { message } = (error as BadRequestException).getResponse() as {
          message: string[];
        };
        expect(message).toContain('property authorId should not exist');
      }
    });

    it('still accepts a body of only declared fields', async () => {
      const dto = (await guarded.transform(
        { title: 'A perfectly legitimate title', isPublished: 'true' },
        metadata,
      )) as Record<string, unknown>;

      expect(dto).toEqual({
        title: 'A perfectly legitimate title',
        isPublished: true,
      });
    });
  });
});

// Multipart sends every field as a string, and JSON sends a real boolean, so
// both DTOs have to accept both. @Type(() => Boolean) cannot do this: it is
// !!value, so the string 'false' would coerce to true.
describe.each([
  ['CreateBlogDto', CreateBlogDto],
  ['UpdateBlogDto', UpdateBlogDto],
])('%s isPublished', (_name, metatype) => {
  const pipe = new ValidationPipe({
    stopAtFirstError: true,
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  // CreateBlogDto requires all three; UpdateBlogDto accepts them as optional.
  const validBody = {
    title: 'A perfectly legitimate title',
    content: 'Body copy long enough to clear the twenty character minimum.',
    tags: ['nest'],
  };

  const coerce = async (isPublished: unknown) => {
    const dto = (await pipe.transform(
      { ...validBody, isPublished },
      { type: 'body', metatype },
    )) as { isPublished?: boolean };
    return dto.isPublished;
  };

  it.each([
    ['true', true],
    ['false', false],
    [true, true],
    [false, false],
  ])('coerces %p to %p', async (input, expected) => {
    await expect(coerce(input)).resolves.toBe(expected);
  });

  it('rejects a value that is neither a boolean nor "true"/"false"', async () => {
    await expect(coerce('yes')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('leaves it undefined when omitted', async () => {
    const dto = (await pipe.transform(validBody, {
      type: 'body',
      metatype,
    })) as { isPublished?: boolean };

    expect(dto.isPublished).toBeUndefined();
  });
});
