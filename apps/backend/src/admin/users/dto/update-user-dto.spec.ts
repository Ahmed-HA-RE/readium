import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateUserDto } from './update-user-dto';

// `UpdateAdminDto` and `UpdateUserProfileDto` both derive from this class, so
// these rules apply to every profile update surface.
const parse = (body: Record<string, unknown>) => {
  const dto = plainToInstance(UpdateUserDto, body);
  const errors = validateSync(dto, { stopAtFirstError: true });
  return { dto, errors };
};

describe('UpdateUserDto', () => {
  describe('clearing a field with an empty string', () => {
    it.each(['bio', 'website'])('turns an empty %s into null', (field) => {
      const { dto, errors } = parse({ [field]: '' });

      expect(errors).toHaveLength(0);
      expect(dto[field as 'bio' | 'website']).toBeNull();
    });

    // Prisma skips `undefined` and writes `null`, so the two must stay distinct.
    it.each(['bio', 'website'])(
      'leaves an omitted %s undefined rather than null',
      (field) => {
        const { dto, errors } = parse({});

        expect(errors).toHaveLength(0);
        expect(dto[field as 'bio' | 'website']).toBeUndefined();
      },
    );

    it('still rejects an empty name, which cannot be cleared', () => {
      const { errors } = parse({ name: '' });

      expect(errors).toHaveLength(1);
    });
  });

  describe('validating a non-empty value', () => {
    it('accepts a valid bio and website', () => {
      const { dto, errors } = parse({
        bio: 'A bio comfortably over ten characters',
        website: 'https://example.com',
      });

      expect(errors).toHaveLength(0);
      expect(dto.bio).toBe('A bio comfortably over ten characters');
      expect(dto.website).toBe('https://example.com');
    });

    it('rejects a bio under ten characters', () => {
      expect(parse({ bio: 'short' }).errors).toHaveLength(1);
    });

    it('rejects a bio over 500 characters', () => {
      expect(parse({ bio: 'a'.repeat(501) }).errors).toHaveLength(1);
    });

    it('rejects a website that is not a URL', () => {
      expect(parse({ website: 'not-a-url' }).errors).toHaveLength(1);
    });

    it('rejects a website without a protocol', () => {
      expect(parse({ website: 'example.com' }).errors).toHaveLength(1);
    });
  });
});
