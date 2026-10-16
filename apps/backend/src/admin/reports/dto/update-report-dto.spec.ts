import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ModerationAction } from '../../../generated/prisma/enums';
import { UpdateReportStatusDto } from './update-report-dto';

// No `skipMissingProperties`, matching the global ValidationPipe, so a missing field fails.
const validate = (body: Record<string, unknown>) =>
  validateSync(plainToInstance(UpdateReportStatusDto, body));

describe('UpdateReportStatusDto', () => {
  describe('status', () => {
    it.each(['RESOLVED', 'REJECTED'])('accepts %s', (status) => {
      const action =
        status === 'RESOLVED' ? ModerationAction.WARNING : undefined;

      expect(validate({ status, action })).toHaveLength(0);
    });

    // Only a pending report can be reviewed, so moving one back to pending means nothing.
    it.each(['PENDING', 'NOT_A_STATUS', ''])('rejects status=%s', (status) => {
      expect(validate({ status })).toHaveLength(1);
    });

    it('rejects a missing status', () => {
      expect(validate({})).toHaveLength(1);
    });
  });

  describe('action', () => {
    it.each(Object.values(ModerationAction))(
      'accepts %s on a resolved report',
      (action) => {
        expect(validate({ status: 'RESOLVED', action })).toHaveLength(0);
      },
    );

    it('requires an action to resolve a report', () => {
      const errors = validate({ status: 'RESOLVED' });

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('action');
    });

    it('rejects an unknown action on a resolved report', () => {
      expect(validate({ status: 'RESOLVED', action: 'DELETE' })).toHaveLength(
        1,
      );
    });

    // Previously `action` was always required, so a report could never be rejected.
    it('needs no action to reject a report', () => {
      expect(validate({ status: 'REJECTED' })).toHaveLength(0);
    });
  });
});
