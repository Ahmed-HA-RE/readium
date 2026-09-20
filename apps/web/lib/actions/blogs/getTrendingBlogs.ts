'use server';

import { cookies } from 'next/headers';
import type { GetTrendingBlogsResponse } from '@repo/types';
import { api } from '@/lib/axios';

export const getTrendingBlogs = async (): Promise<
  GetTrendingBlogsResponse[]
> => {
  const { data } = await api.get<GetTrendingBlogsResponse[]>(
    '/blogs/trending',
    { headers: { Cookie: (await cookies()).toString() } },
  );

  return data;
};
