'use server';

import { cookies } from 'next/headers';
import type { UpdateReportStatusResponse } from '@repo/types';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';
import type { ReviewReportFormData } from '@/schema/report';

// Returns the error instead of throwing it, since a thrown `AxiosError` loses its response crossing to the client.
export const updateAdminReportStatus = async ({
  reportId,
  status,
  action,
}: ReviewReportFormData & { reportId: string }): Promise<{
  banFailed?: boolean;
  error?: string;
}> => {
  try {
    const { data } = await api.put<UpdateReportStatusResponse>(
      `/admin/reports/${encodeURIComponent(reportId)}/status`,
      { status, action },
      { headers: { Cookie: (await cookies()).toString() } },
    );

    return { banFailed: data.banFailed };
  } catch (error) {
    return {
      error: getErrorMessage(error, 'Could not review the report'),
    };
  }
};
