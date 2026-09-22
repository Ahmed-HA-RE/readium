import { api } from '@/lib/axios';

export const unbookmarkBlog = async (
  slug: string,
): Promise<{ isBookmarked: boolean }> => {
  const { data } = await api.delete<{ isBookmarked: boolean }>(
    `/blogs/${slug}/bookmarks`,
  );

  return data;
};
