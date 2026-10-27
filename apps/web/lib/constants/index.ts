export const SITE_NAME = 'Readium';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Shown for a user who has never uploaded an avatar. Served from `public/`.
export const DEFAULT_AVATAR = '/default_avatar.png';

// Shown for a blog published without a cover image.
export const DEFAULT_BLOG_COVER = '/default_blog_cover.jpg';

// What deleting an account removes, one entry per `onDelete: Cascade` relation on `User` in `schema.prisma`.
export const ACCOUNT_DELETION_CONSEQUENCES = [
  'Your profile data',
  'Every story you wrote, drafts included, along with the responses, likes and bookmarks other readers left on them',
  'Every response you wrote on other stories',
  'Your likes and bookmarked reading list',
  'The reports you filed',
  'Your password and every linked Google, GitHub or Twitch account',
  'Every active session, so you are signed out on all devices',
] as const;

// Admins can't write, respond, like, bookmark or report, so only the account itself goes.
export const ADMIN_ACCOUNT_DELETION_CONSEQUENCES = [
  'Your profile data',
  'Your password, two-factor setup and every linked Google, GitHub or Twitch account',
  'Every active session, so you are signed out on all devices',
  'Your access to the admin dashboard',
] as const;

// The NestJS API, not better-auth's own mount point — that one is
// NEXT_PUBLIC_BETTER_AUTH_URL and already ends in /api/auth.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// The backend origin with no path: socket.io reads a path as a namespace, so `API_URL` would ask for `/api`.
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

// The live account in production, the sandbox everywhere else; the admin UI never says which.
export const STRIPE_DASHBOARD_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_STRIPE_LIVE_URL
    : process.env.NEXT_PUBLIC_STRIPE_TEST_URL;
