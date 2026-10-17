'use server';

import { cookies } from 'next/headers';
import type {
  GetAllReportsWithFilters,
  ReportReason,
  ReportStatus,
} from '@repo/types';
import { api } from '@/lib/axios';

export type GetAdminReportsParams = {
  search: string;
  reason: ReportReason | null;
  status: ReportStatus | null;
  page: number;
  limit: number;
};

export const getAdminReports = async ({
  search,
  reason,
  status,
  page,
  limit,
}: GetAdminReportsParams): Promise<GetAllReportsWithFilters> => {
  const { data } = await api.get<GetAllReportsWithFilters>('/admin/reports', {
    params: {
      reporterName: search || undefined,
      reason,
      status,
      page,
      limit,
    },
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
