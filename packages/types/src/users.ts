import { Blog } from './blogs';

/**
 * The public face of a user. Deliberately excludes `email`, `role`, `banned`
 * and every other moderation column: this payload is served to anonymous
 * callers, so anything not listed here must not be added without a review.
 */
export interface PublicUserProfile {
  name: string;
  bio: string | null;
  website: string | null;
  image: string | null;
}

export interface GetUserProfileWithBlogs {
  user: PublicUserProfile;
  // Published blogs only. No comment list is embedded — the profile shows the
  // blogs themselves, and comments belong to the single-blog endpoint.
  blogs: Pick<
    Blog,
    | 'id'
    | 'title'
    | 'slug'
    | 'content'
    | 'tags'
    | 'coverImage'
    | 'createdAt'
    | '_count'
  >[];
  totalPages: number;
}

/**
 * The signed-in user, as `GET /api/users/me` returns them.
 *
 * This mirrors better-auth's own `User` rather than importing it: this package
 * is dependency-free, and adding `better-auth` to it just to alias two types
 * is not worth the cost. The backend does not rely on this mirror — the
 * service is annotated against the real `UserSession`, so the response is
 * whatever better-auth actually carries. Keep the two in step by hand: see
 * `getCurrentLoggedInUser` in `apps/backend/src/users/users.service.ts`.
 *
 * The endpoint adds exactly two things to what the session provides:
 *
 * - `isPro`, hardcoded for now.
 * - `image` rewritten from the stored S3 key to a presigned URL, so the
 *   dashboard sidebar has something it can render.
 */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Contributed by better-auth's admin plugin. Optional: a plain `user`
  // account carries no ban state.
  role?: string | string[];
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  /**
   * Hardcoded `true` for now. Subscriptions are not implemented, so there is
   * nothing to derive this from yet — see `PLACEHOLDER_IS_PRO` in
   * `apps/backend/src/users/users.service.ts`.
   */
  isPro: boolean;
}

/** The current session row backing the request, as better-auth returns it. */
export interface CurrentSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  impersonatedBy?: string | null;
}

/**
 * `GET /api/users/me`. Consumed by the Next.js app when it fetches the current
 * user during SSR, and by the dashboard sidebar (avatar, name, email, isPro).
 */
export interface GetCurrentLoggedInUser {
  session: CurrentSession;
  user: CurrentUser;
}

/**
 * `GET /api/users/me/blogs`. Unlike the public profile this includes drafts —
 * they are the owner's own — so `isPublished` is returned for the UI to flag
 * them.
 */
export interface GetMyBlogs {
  blogs: Pick<
    Blog,
    | 'id'
    | 'title'
    | 'slug'
    | 'content'
    | 'tags'
    | 'coverImage'
    | 'isPublished'
    | 'createdAt'
    | '_count'
  >[];
  totalPages: number;
}
