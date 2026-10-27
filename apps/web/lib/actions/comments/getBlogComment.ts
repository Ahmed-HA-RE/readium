import type { Comment } from '@repo/types';
import { api } from '@/lib/axios';

export type GetBlogCommentParams = {
  slug: string;
  commentId: string;
};

// Public endpoint, so no cookie forwarding is needed. The pinned comment is optional, so any failure
// (a deleted comment's 404, a hand-edited id's 400) is `null` and the blog renders without it.
export const getBlogComment = async ({
  slug,
  commentId,
}: GetBlogCommentParams): Promise<Comment | null> => {
  try {
    const { data } = await api.get<Comment>(
      `/blogs/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`,
    );

    return data;
  } catch {
    return null;
  }
};
