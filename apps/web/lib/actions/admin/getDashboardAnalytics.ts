'use server';

import { cookies } from 'next/headers';
import type { AdminDashboardAnalytics } from '@repo/types';
import { api } from '@/lib/axios';

export const getDashboardAnalytics =
  async (): Promise<AdminDashboardAnalytics> => {
    const { data } = await api.get<AdminDashboardAnalytics>(
      '/admin/analytics',
      { headers: { Cookie: (await cookies()).toString() } },
    );

    return data;
  };
