import { cookies } from 'next/headers';
import type { GetCurrentLoggedInUser } from '@repo/types';
import { API_URL } from '@/lib/constants';

export const getCurrentLoggedInUser =
  async (): Promise<GetCurrentLoggedInUser | null> => {
    const response = await fetch(`${API_URL}/users/me`, {
      credentials: 'include',
      headers: { Cookie: (await cookies()).toString() },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    return response.json();
  };
