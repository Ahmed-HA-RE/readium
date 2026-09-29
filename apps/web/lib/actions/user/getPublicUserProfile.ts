import { cache } from 'react';
import axios from 'axios';
import type { PublicUserProfile } from '@repo/types';
import { api } from '@/lib/axios';

// `cache` dedupes this per request, so `generateMetadata` and the page share one
// fetch. `null` means no such user, or a banned one; any other failure throws.
export const getPublicUserProfile = cache(
  async (username: string): Promise<PublicUserProfile | null> => {
    try {
      const { data } = await api.get<PublicUserProfile>(
        `/users/${encodeURIComponent(username)}`,
      );

      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw error;
    }
  },
);
