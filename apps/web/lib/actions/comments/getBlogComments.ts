import type { GetBlogCommentsResponse } from '@repo/types';
import { api } from '@/lib/axios';

export type GetBlogCommentsParams = {
  slug: string;
  cursor?: string;
};

// Public endpoint, called from the browser, so no cookie forwarding is needed.
export const getBlogComments = async ({
  slug,
  cursor,
}: GetBlogCommentsParams): Promise<GetBlogCommentsResponse> => {
  const { data } = await api.get<GetBlogCommentsResponse>(
    `/blogs/${encodeURIComponent(slug)}/comments`,
    { params: { cursor } },
  );

  return data;
};
