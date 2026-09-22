import { api } from '@/lib/axios';

// Answers 400 when the blog is already liked, so the caller must only reach
// here on a real state change.
export const likeBlog = async (slug: string): Promise<{ isLiked: boolean }> => {
  const { data } = await api.post<{ isLiked: boolean }>(`/blogs/${slug}/likes`);

  return data;
};
