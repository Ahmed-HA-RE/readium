import { createAuthClient } from 'better-auth/react';
import {
  adminClient,
  lastLoginMethodClient,
  twoFactorClient,
} from 'better-auth/client/plugins';
import { stripeClient } from '@better-auth/stripe/client';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string,
  plugins: [
    adminClient(),
    lastLoginMethodClient(),
    // Keeps the login page's `?callbackUrl=` so `/2fa` can send the user on after the code.
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = `/2fa${window.location.search}`;
      },
    }),
    stripeClient({ subscription: true }),
  ],
});
