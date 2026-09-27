'use server';

import { cookies } from 'next/headers';
import type { GetMyLikesAndBookmarks } from '@repo/types';
import type { ListsTab } from '@/lib/search-params';
import { api } from '@/lib/axios';

export type LikesOrBookmarks = Exclude<ListsTab, 'comments'>;

export const getMyLikesOrBookmarks = async (
  list: LikesOrBookmarks,
  page: number,
): Promise<GetMyLikesAndBookmarks> => {
  const { data } = await api.get<GetMyLikesAndBookmarks>(`/users/me/${list}`, {
    params: { page },
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
