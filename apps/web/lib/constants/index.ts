export const SITE_NAME = 'Readium';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// The NestJS API, not better-auth's own mount point — that one is
// NEXT_PUBLIC_BETTER_AUTH_URL and already ends in /api/auth.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
