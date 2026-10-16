import { z } from 'zod';
import { ModerationAction, ReportReason, ReportStatus } from '@repo/types';

export const reportBlogSchema = z.object({
  reason: z.enum(Object.values(ReportReason), {
    error: 'Invalid report reason',
  }),
});

export type ReportBlogFormData = z.infer<typeof reportBlogSchema>;

// Mirrors `UpdateReportStatusDto`: an action is required to resolve, and a rejection takes none.
export const reviewReportSchema = z
  .object({
    status: z.enum([ReportStatus.RESOLVED, ReportStatus.REJECTED], {
      error: 'Choose a status',
    }),
    action: z.enum(Object.values(ModerationAction)).optional(),
  })
  .refine((data) => data.status === ReportStatus.REJECTED || data.action, {
    error: 'Choose an action to resolve the report',
    path: ['action'],
  });

export type ReviewReportFormData = z.infer<typeof reviewReportSchema>;
