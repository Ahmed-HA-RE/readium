import type { Comment } from '@repo/types';
import { api } from '@/lib/axios';

export type CreateCommentParams = {
  slug: string;
  content: string;
};

export const createComment = async ({
  slug,
  content,
}: CreateCommentParams): Promise<Comment> => {
  const { data } = await api.post<Comment>(
    `/blogs/${encodeURIComponent(slug)}/comments`,
    { content },
  );

  return data;
};
