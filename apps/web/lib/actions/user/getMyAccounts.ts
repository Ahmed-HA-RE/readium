'use server';

import { cookies } from 'next/headers';
import type { LinkedAccount } from '@repo/types';
import { api } from '@/lib/axios';

// Every provider linked to the signed-in user; a `credential` row means they have a password.
export const getMyAccounts = async (): Promise<LinkedAccount[]> => {
  const { data } = await api.get<LinkedAccount[]>('/users/me/accounts', {
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
