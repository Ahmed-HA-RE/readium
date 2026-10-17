import { Prisma } from '../../generated/prisma/client';
import { ModerationAction, ReportStatus } from '../../generated/prisma/enums';

// A resolved report that ended in a ban keeps its blog from being republished, by an admin or the author.
export const banReportFilter = {
  status: ReportStatus.RESOLVED,
  action: {
    in: [ModerationAction.TEMPORARY_BAN, ModerationAction.PERMANENT_BAN],
  },
} satisfies Prisma.ReportWhereInput;
