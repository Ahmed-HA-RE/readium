'use server';

import { cookies } from 'next/headers';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';

// Any author's blog, unlike `deleteBlog`, which only deletes the caller's own.
export const deleteAdminBlog = async (
  slug: string,
): Promise<{ error?: string }> => {
  try {
    await api.delete(`/admin/blogs/${encodeURIComponent(slug)}`, {
      headers: { Cookie: (await cookies()).toString() },
    });

    return {};
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete the story') };
  }
};
