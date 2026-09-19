'use server';

import { cookies } from 'next/headers';
import type { BlogSortOptions, GetAllBlogsResponse } from '@repo/types';
import { api } from '@/lib/axios';

export type GetAllBlogsParams = {
  sort: BlogSortOptions;
  page: number;
};

export const getAllBlogs = async ({
  sort,
  page,
}: GetAllBlogsParams): Promise<GetAllBlogsResponse> => {
  const { data } = await api.get<GetAllBlogsResponse>('/blogs', {
    params: { sort, page },
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
