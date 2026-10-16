'use server';

import { cookies } from 'next/headers';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';
import type { ReviewReportFormData } from '@/schema/report';

// Returns the error instead of throwing it, since a thrown `AxiosError` loses its response crossing to the client.
export const updateAdminReportStatus = async ({
  reportId,
  status,
  action,
}: ReviewReportFormData & { reportId: string }): Promise<{
  error?: string;
}> => {
  try {
    await api.put(
      `/admin/reports/${encodeURIComponent(reportId)}/status`,
      { status, action },
      { headers: { Cookie: (await cookies()).toString() } },
    );

    return {};
  } catch (error) {
    return {
      error: getErrorMessage(error, 'Could not review the report'),
    };
  }
};
