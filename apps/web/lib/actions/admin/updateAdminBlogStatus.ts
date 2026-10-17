'use server';

import { cookies } from 'next/headers';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';

// Returns the error instead of throwing it, since a thrown `AxiosError` loses its response crossing to the client.
export const updateAdminBlogStatus = async ({
  slug,
  isPublished,
}: {
  slug: string;
  isPublished: boolean;
}): Promise<{ error?: string }> => {
  try {
    await api.put(
      `/admin/blogs/${encodeURIComponent(slug)}/status`,
      { isPublished },
      { headers: { Cookie: (await cookies()).toString() } },
    );

    return {};
  } catch (error) {
    return {
      error: getErrorMessage(error, 'Could not update the story status'),
    };
  }
};
