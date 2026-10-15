'use server';

import { cookies } from 'next/headers';
import type { AdminBlogStatus, GetAllBlogsForAdmin } from '@repo/types';
import { api } from '@/lib/axios';

export type GetAdminBlogsParams = {
  search: string;
  status: AdminBlogStatus | null;
  page: number;
  limit: number;
};

export const getAdminBlogs = async ({
  search,
  status,
  page,
  limit,
}: GetAdminBlogsParams): Promise<GetAllBlogsForAdmin> => {
  const { data } = await api.get<GetAllBlogsForAdmin>('/admin/blogs', {
    params: {
      search: search || undefined,
      status,
      page,
      limit,
    },
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
