'use server';

import { cookies } from 'next/headers';
import type { GetUnreadNotificationsCountResponse } from '@repo/types';
import { api } from '@/lib/axios';

export const getUnreadNotificationsCount =
  async (): Promise<GetUnreadNotificationsCountResponse> => {
    const { data } = await api.get<GetUnreadNotificationsCountResponse>(
      '/notifications/unread-count',
      { headers: { Cookie: (await cookies()).toString() } },
    );

    return data;
  };
