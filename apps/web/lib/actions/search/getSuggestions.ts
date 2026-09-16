import type { GetSearchSuggestions } from '@repo/types';
import { api } from '@/lib/axios';

// `q` is omitted when the palette first opens, which returns the latest rows.
export const getSuggestions = async (
  q?: string,
): Promise<GetSearchSuggestions> => {
  const { data } = await api.get<GetSearchSuggestions>('/search/suggestions', {
    params: q ? { q } : undefined,
  });

  return data;
};
