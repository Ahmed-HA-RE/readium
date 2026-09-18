import { cache } from 'react';
import { cookies } from 'next/headers';
import type { GetCurrentLoggedInUser } from '@repo/types';
import { api } from '@/lib/axios';

// `cache` dedupes this per request, so the layout, the header and the page can
// each call it while only one request reaches the backend.
export const getCurrentLoggedInUser = cache(
  async (): Promise<GetCurrentLoggedInUser | null> => {
    try {
      const { data } = await api.get<GetCurrentLoggedInUser>('/users/me', {
        headers: { Cookie: (await cookies()).toString() },
      });

      return data;
    } catch {
      // axios throws on 401/403, where fetch only set `ok: false`. Any failure here
      // means no session we can confirm, which callers already treat as signed out.
      return null;
    }
  },
);
