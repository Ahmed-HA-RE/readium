'use server';

import { cookies } from 'next/headers';
import type { GetNotificationsResponse } from '@repo/types';
import { api } from '@/lib/axios';

export const getNotifications = async (
  cursor?: string,
): Promise<GetNotificationsResponse> => {
  const { data } = await api.get<GetNotificationsResponse>('/notifications', {
    params: { cursor },
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
