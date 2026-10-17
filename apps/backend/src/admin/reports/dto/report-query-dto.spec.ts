// @Type() reads design-time metadata; no Nest import here pulls this in.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ReportQueryDto } from './report-query-dto';

// Query params always arrive as strings, so every fixture here is a string.
const parse = (queryParams: Record<string, unknown>) => {
  const dto = plainToInstance(ReportQueryDto, queryParams);
  const errors = validateSync(dto, { skipMissingProperties: true });
  return { dto, errors };
};

describe('ReportQueryDto', () => {
  describe('page', () => {
    // The old @Transform mapped a bad value to undefined, so these reached
    // Prisma as a negative or fractional `skip`.
    it.each(['0', '-5', '1.5', 'abc', ''])('rejects page=%s', (page) => {
      expect(parse({ page }).errors).toHaveLength(1);
    });

    it('accepts a positive integer and transforms it to a number', () => {
      const { dto, errors } = parse({ page: '3' });

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(3);
    });
  });

  describe('limit', () => {
    it.each(['0', '-1', '1.5', 'abc', ''])('rejects limit=%s', (limit) => {
      expect(parse({ limit }).errors).toHaveLength(1);
    });

    // Only the table's page sizes are allowed, which also caps `take`.
    it.each(['10', '100', '1000000'])(
      'rejects limit=%s as not a page size',
      (limit) => {
        expect(parse({ limit }).errors).toHaveLength(1);
      },
    );

    it.each(['5', '15', '20', '25'])(
      'accepts the page size %s and transforms it to a number',
      (limit) => {
        const { dto, errors } = parse({ limit });

        expect(errors).toHaveLength(0);
        expect(dto.limit).toBe(Number(limit));
      },
    );
  });

  // The service defaults both to page 1 of 10, so omitting them stays valid.
  it('accepts an empty query', () => {
    const { dto, errors } = parse({});

    expect(errors).toHaveLength(0);
    expect(dto.page).toBeUndefined();
    expect(dto.limit).toBeUndefined();
  });

  it('still validates the filters alongside pagination', () => {
    expect(parse({ reason: 'NOT_A_REASON' }).errors).toHaveLength(1);
    expect(parse({ status: 'NOT_A_STATUS' }).errors).toHaveLength(1);
    expect(parse({ reporterName: 'ab' }).errors).toHaveLength(1);
  });
});
