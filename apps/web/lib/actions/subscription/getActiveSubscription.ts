'use server';

import { cookies } from 'next/headers';
import type { Subscription } from '@better-auth/stripe';
import { api } from '@/lib/axios';

// The endpoint returns only active or trialing subscriptions, and the plugin allows one per user.
// Dates arrive as ISO strings over JSON, despite the plugin's `Date` types.
export const getActiveSubscription = async (): Promise<Subscription | null> => {
  const { data } = await api.get<Subscription[]>('/auth/subscription/list', {
    headers: { Cookie: (await cookies()).toString() },
  });

  return data[0] ?? null;
};
