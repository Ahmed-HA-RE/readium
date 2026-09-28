'use server';

import { cookies } from 'next/headers';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';

// Returns the error instead of throwing it, since a thrown `AxiosError` loses its response crossing to the client.
export const deleteBlog = async (slug: string): Promise<{ error?: string }> => {
  try {
    await api.delete(`/blogs/${encodeURIComponent(slug)}`, {
      headers: { Cookie: (await cookies()).toString() },
    });

    return {};
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete the story') };
  }
};
