'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getBlogComments } from '@/lib/actions/comments/getBlogComments';

export const useBlogComments = (slug: string) =>
  useInfiniteQuery({
    queryKey: ['comments', slug],
    queryFn: ({ pageParam }) => getBlogComments({ slug, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    // The backend sends `null` once a page comes back short.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
