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
import {
  getUserBlogs,
  type GetUserBlogsParams,
} from '@/lib/actions/user/getUserBlogs';

const DEFAULT_STALE_TIME = 5 * 1000 * 60; // 5 minutes

// A search of 1 to this many characters is too broad to run.
export const MIN_BLOG_SEARCH_LENGTH = 4;

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

// Under `['blogs']`, so a like or bookmark on one of these cards refreshes the list.
// While the search is too short, the previous results stay on screen.
export const useUserBlogs = ({
  username,
  search,
  sort,
  page,
}: GetUserBlogsParams) =>
  useQuery({
    queryKey: ['blogs', 'user', username, { search, sort, page }],
    queryFn: () => getUserBlogs({ username, search, sort, page }),
    enabled: !search || search.length >= MIN_BLOG_SEARCH_LENGTH,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

export const useMyLikesOrBookmarks = (list: LikesOrBookmarks, page: number) =>
  useQuery({
    queryKey: ['blogs', 'me', list, { page }],
    queryFn: () => getMyLikesOrBookmarks(list, page),
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: keepPreviousData,
  });
