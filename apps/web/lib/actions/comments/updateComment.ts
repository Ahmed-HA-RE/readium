import type { Comment } from '@repo/types';
import { api } from '@/lib/axios';

export type UpdateCommentParams = {
  slug: string;
  commentId: string;
  content: string;
};

export const updateComment = async ({
  slug,
  commentId,
  content,
}: UpdateCommentParams): Promise<Comment> => {
  const { data } = await api.put<Comment>(
    `/blogs/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`,
    { content },
  );

  return data;
};
