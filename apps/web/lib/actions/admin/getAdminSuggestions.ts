'use server';

import { cookies } from 'next/headers';
import type { GetAdminSuggestions } from '@repo/types';
import { api } from '@/lib/axios';

// `q` is omitted when the search first opens, which returns the latest users.
export const getAdminSuggestions = async (
  q?: string,
): Promise<GetAdminSuggestions> => {
  const { data } = await api.get<GetAdminSuggestions>('/admin/suggestions', {
    params: q ? { q } : undefined,
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
