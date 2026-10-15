'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAdminSuggestions } from '@/lib/actions/admin/getAdminSuggestions';
import {
  getAdminBlogs,
  type GetAdminBlogsParams,
} from '@/lib/actions/admin/getAdminBlogs';
import {
  getAdminUsers,
  type GetAdminUsersParams,
} from '@/lib/actions/admin/getAdminUsers';

// Below this, the typed value is ignored and the latest users are shown instead.
const MIN_SEARCH_LENGTH = 2;

// Matches the `@MinLength(3)` on the admin list DTOs' `search`.
export const MIN_ADMIN_TABLE_SEARCH_LENGTH = 3;

// `term` is expected to be debounced by the caller; the query only runs while the search is open.
export const useAdminSuggestions = (term: string, enabled: boolean) => {
  const trimmed = term.trim();
  const q = trimmed.length > MIN_SEARCH_LENGTH ? trimmed : undefined;

  return useQuery({
    queryKey: ['admin-suggestions', q ?? ''],
    queryFn: () => getAdminSuggestions(q),
    enabled,
    // A ban can land between two opens, so the badges must not come from a stale cache.
    staleTime: 0,
    // Retrying a 429 only spends more of the quota that already ran out.
    retry: false,
  });
};

// Under `['blogs']`, so an admin action or an author's edit refreshes the table too.
// While the search is too short, the previous rows stay on screen.
export const useAdminBlogs = ({
  search,
  status,
  page,
  limit,
}: GetAdminBlogsParams) =>
  useQuery({
    queryKey: ['blogs', 'admin', { search, status, page, limit }],
    queryFn: () => getAdminBlogs({ search, status, page, limit }),
    enabled: !search || search.length >= MIN_ADMIN_TABLE_SEARCH_LENGTH,
    placeholderData: keepPreviousData,
  });

// Under `['users', 'admin']`, which a ban or a session revoke refreshes.
// While the search is too short, the previous rows stay on screen.
export const useAdminUsers = ({
  search,
  status,
  page,
  limit,
}: GetAdminUsersParams) =>
  useQuery({
    queryKey: ['users', 'admin', { search, status, page, limit }],
    queryFn: () => getAdminUsers({ search, status, page, limit }),
    enabled: !search || search.length >= MIN_ADMIN_TABLE_SEARCH_LENGTH,
    placeholderData: keepPreviousData,
  });
