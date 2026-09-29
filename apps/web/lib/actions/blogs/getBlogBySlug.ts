import { cache } from 'react';
import axios from 'axios';
import { cookies } from 'next/headers';
import type { GetBlogBySlugResponse } from '@repo/types';
import { api } from '@/lib/axios';

// `null` means no published blog has this slug. Any other failure still
// throws, so a backend outage is not mistaken for a missing blog. `cache`
// dedupes it per request, so `generateMetadata` and the page share one fetch.
export const getBlogBySlug = cache(
  async (slug: string): Promise<GetBlogBySlugResponse | null> => {
    try {
      const { data } = await api.get<GetBlogBySlugResponse>(
        `/blogs/${encodeURIComponent(slug)}`,
        { headers: { Cookie: (await cookies()).toString() } },
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
