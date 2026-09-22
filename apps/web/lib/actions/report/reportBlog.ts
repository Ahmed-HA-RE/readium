import type { Report, ReportReason } from '@repo/types';
import { api } from '@/lib/axios';

export type ReportBlogParams = {
  slug: string;
  reason: ReportReason;
};

// Answers 400 for a second report on the same blog, and for reporting your own.
export const reportBlog = async ({
  slug,
  reason,
}: ReportBlogParams): Promise<Report> => {
  const { data } = await api.post<Report>(`/reports/${slug}`, { reason });

  return data;
};
