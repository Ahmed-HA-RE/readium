'use server';

import { cookies } from 'next/headers';
import type { MarkAllNotificationsAsReadResponse } from '@repo/types';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';

// Returns the error instead of throwing it, since a thrown `AxiosError` loses its response crossing to the client.
export const markAllNotificationsAsRead = async (): Promise<{
  error?: string;
}> => {
  try {
    await api.put<MarkAllNotificationsAsReadResponse>(
      '/notifications/read',
      undefined,
      { headers: { Cookie: (await cookies()).toString() } },
    );

    return {};
  } catch (error) {
    return {
      error: getErrorMessage(error, 'Could not mark your notifications as read'),
    };
  }
};
