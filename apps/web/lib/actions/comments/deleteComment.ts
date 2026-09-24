import { api } from '@/lib/axios';

export type DeleteCommentParams = {
  slug: string;
  commentId: string;
};

export const deleteComment = async ({
  slug,
  commentId,
}: DeleteCommentParams): Promise<void> => {
  await api.delete(
    `/blogs/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`,
  );
};
