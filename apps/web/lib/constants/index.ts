export const SITE_NAME = 'Readium';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Shown for a user who has never uploaded an avatar. Served from `public/`.
export const DEFAULT_AVATAR = '/default_avatar.png';

// Shown for a blog published without a cover image.
export const DEFAULT_BLOG_COVER = '/default_blog_cover.jpg';

// The NestJS API, not better-auth's own mount point — that one is
// NEXT_PUBLIC_BETTER_AUTH_URL and already ends in /api/auth.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
