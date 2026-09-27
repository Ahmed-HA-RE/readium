'use server';

import { cookies } from 'next/headers';
import type { GetMyComments } from '@repo/types';
import { api } from '@/lib/axios';

export const getMyComments = async (
  cursor?: string,
): Promise<GetMyComments> => {
  const { data } = await api.get<GetMyComments>('/users/me/comments', {
    params: { cursor },
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
