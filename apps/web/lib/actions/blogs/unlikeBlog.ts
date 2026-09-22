import { api } from '@/lib/axios';

export const unlikeBlog = async (
  slug: string,
): Promise<{ isLiked: boolean }> => {
  const { data } = await api.delete<{ isLiked: boolean }>(
    `/blogs/${slug}/likes`,
  );

  return data;
};
