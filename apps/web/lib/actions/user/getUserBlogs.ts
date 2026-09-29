'use server';

import { cookies } from 'next/headers';
import type { BlogSortOptions, GetUserBlogs } from '@repo/types';
import { api } from '@/lib/axios';

export type GetUserBlogsParams = {
  username: string;
  search: string;
  sort: BlogSortOptions;
  page: number;
};

// The cookie is optional here: with it, the like/bookmark flags are the
// viewer's and the blogs they reported are left out.
export const getUserBlogs = async ({
  username,
  search,
  sort,
  page,
}: GetUserBlogsParams): Promise<GetUserBlogs> => {
  const { data } = await api.get<GetUserBlogs>(
    `/users/${encodeURIComponent(username)}/blogs`,
    {
      params: { search, sort, page },
      headers: { Cookie: (await cookies()).toString() },
    },
  );

  return data;
};
