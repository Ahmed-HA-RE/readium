'use client';

import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { isUsernameTaken } from '@/lib/actions/user/isUsernameTaken';

// Better Auth returns `{ data, error }` instead of throwing, so the error is rethrown for `isError`.
export const useMySessions = () =>
  useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data, error } = await authClient.listSessions();
      if (error) throw new Error(error.message ?? 'Could not load your sessions');
      return data;
    },
    retry: false,
  });

// `username` is expected to be debounced by the caller. The query stays
// disabled below 3 characters, which is the minimum the endpoint's DTO accepts.
export const useIsUsernameTaken = (username: string) => {
  const trimmed = username.trim();

  return useQuery({
    queryKey: ['username-taken', trimmed],
    queryFn: () => isUsernameTaken(trimmed),
    enabled: trimmed.length >= 3 && trimmed.length <= 50,
    // Retrying a 429 only spends more of the quota that already ran out.
    retry: false,
  });
};
