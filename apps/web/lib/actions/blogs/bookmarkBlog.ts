import { api } from '@/lib/axios';

// Answers 400 when the blog is already bookmarked, so the caller must only
// reach here on a real state change.
export const bookmarkBlog = async (
  slug: string,
): Promise<{ isBookmarked: boolean }> => {
  const { data } = await api.post<{ isBookmarked: boolean }>(
    `/blogs/${slug}/bookmarks`,
  );

  return data;
};
