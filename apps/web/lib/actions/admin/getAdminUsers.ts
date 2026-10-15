'use server';

import { cookies } from 'next/headers';
import type { GetAllUsersAsAdmin } from '@repo/types';
import { api } from '@/lib/axios';
import type { AdminUserStatus } from '@/lib/search-params';

export type GetAdminUsersParams = {
  search: string;
  status: AdminUserStatus | null;
  page: number;
  limit: number;
};

export const getAdminUsers = async ({
  search,
  status,
  page,
  limit,
}: GetAdminUsersParams): Promise<GetAllUsersAsAdmin> => {
  const { data } = await api.get<GetAllUsersAsAdmin>('/admin/users', {
    params: {
      // Axios drops `undefined` but keeps `''`, which the DTO's `@MinLength(3)` rejects.
      search: search || undefined,
      // Absent means everyone; `active` is sent as `banned=false`.
      banned: status ? status === 'banned' : undefined,
      page,
      limit,
    },
    headers: { Cookie: (await cookies()).toString() },
  });

  return data;
};
