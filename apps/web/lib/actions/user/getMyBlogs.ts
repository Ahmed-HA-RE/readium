'use server';

import { cookies } from 'next/headers';
import type { BlogSortOptions, GetMyBlogs, MyBlogsStatus } from '@repo/types';
import { api } from '@/lib/axios';

export type GetMyBlogsParams = {
  status: MyBlogsStatus;
  search: string;
  sort: BlogSortOptions;
  page: number;
};

export const getMyBlogs = async ({
  status,
  search,
  sort,
  page,
}: GetMyBlogsParams): Promise<GetMyBlogs> => {
  const { data } = await api.get<GetMyBlogs>('/users/me/blogs', {
    params: { status, search, sort, page },
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
