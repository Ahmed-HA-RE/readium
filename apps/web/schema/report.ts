import { z } from 'zod';
import { ReportReason } from '@repo/types';

export const reportBlogSchema = z.object({
  reason: z.enum(Object.values(ReportReason), {
    error: 'Invalid report reason',
  }),
});

export type ReportBlogFormData = z.infer<typeof reportBlogSchema>;
