'use client';

import { useQuery } from '@tanstack/react-query';
import { getSuggestions } from '@/lib/actions/search/getSuggestions';

// Below this, the typed value is ignored and the latest rows are shown instead.
const MIN_SEARCH_LENGTH = 2;

/**
 * `term` is expected to be debounced by the caller. At or below
 * `MIN_SEARCH_LENGTH` the query runs unfiltered, so the palette still has
 * something to show while the user is typing their first characters.
 */
export const useSearchSuggestions = (term: string, enabled: boolean) => {
  const trimmed = term.trim();
  const q = trimmed.length > MIN_SEARCH_LENGTH ? trimmed : undefined;

  return useQuery({
    queryKey: ['search-suggestions', q ?? ''],
    queryFn: () => getSuggestions(q),
    // Only fetches once the palette is open; closing it keeps the cache.
    enabled,
    // Overrides the 60s global default. The suggestions drop blogs the caller
    // has reported, so a cached list goes wrong the moment one is reported —
    // reopening the palette has to ask the server again.
    staleTime: 0,
    // Retrying a 429 only spends more of the quota that already ran out.
    retry: false,
  });
};
