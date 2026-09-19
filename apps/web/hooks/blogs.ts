'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAllBlogs,
  type GetAllBlogsParams,
} from '@/lib/actions/blogs/getAllBlogs';

// The key must match the server prefetch in `blog-feed-section.tsx` exactly, or
// the client refetches instead of reading the hydrated cache.
export const useAllBlogs = ({ sort, page }: GetAllBlogsParams) =>
  useQuery({
    queryKey: ['blogs', { sort, page }],
    queryFn: () => getAllBlogs({ sort, page }),
    staleTime: 5 * 1000 * 60, // 5 minutes
  });
