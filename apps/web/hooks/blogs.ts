'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getAllBlogs,
  type GetAllBlogsParams,
} from '@/lib/actions/blogs/getAllBlogs';
import {
  getMyBlogs,
  type GetMyBlogsParams,
} from '@/lib/actions/user/getMyBlogs';
import {
  getMyLikesOrBookmarks,
  type LikesOrBookmarks,
} from '@/lib/actions/user/getMyLikesOrBookmarks';

const DEFAULT_STALE_TIME = 5 * 1000 * 60; // 5 minutes

// The key must match the server prefetch in `blog-feed-section.tsx` exactly, or
// the client refetches instead of reading the hydrated cache.
export const useAllBlogs = ({ sort, page }: GetAllBlogsParams) =>
  useQuery({
    queryKey: ['blogs', { sort, page }],
    queryFn: () => getAllBlogs({ sort, page }),
    staleTime: DEFAULT_STALE_TIME, // 5 minutes
  });

export const useMyBlogs = (
  { status, search, sort, page }: GetMyBlogsParams,
  { enabled = true }: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: ['blogs', 'me', status, { search, sort, page }],
    queryFn: () => getMyBlogs({ status, search, sort, page }),
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: keepPreviousData,
    enabled,
  });

export const useMyLikesOrBookmarks = (list: LikesOrBookmarks, page: number) =>
  useQuery({
    queryKey: ['blogs', 'me', list, { page }],
    queryFn: () => getMyLikesOrBookmarks(list, page),
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: keepPreviousData,
  });
