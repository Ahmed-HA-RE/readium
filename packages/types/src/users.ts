import { Blog, BlogAuthor, GetAllBlogsResponse } from './blogs';
import { Comment } from './comments';

// `GET /api/users/:username`. Served to anonymous callers, so `email`, `role`,
// `banned` and every other moderation column are excluded — do not add one
// without a review. Every count is over published blogs only.
export interface PublicUserProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  website: string | null;
  _count: {
    blogs: number;
    likes: number;
    bookmarks: number;
  };
}

// `GET /api/users/:username/blogs`. The feed's card shape, so `BlogCard` renders it as-is.
export type GetUserBlogs = GetAllBlogsResponse;

/**
 * The signed-in user, as `GET /api/users/me` returns them. Mirrors
 * better-auth's `User` by hand to keep this package dependency-free, so keep
 * it in step with `getCurrentLoggedInUser`.
 */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Declared as `user.additionalFields` in `apps/backend/lib/auth.ts`, so
  // better-auth carries them on the session user.
  bio?: string | null;
  website?: string | null;
  // From better-auth's admin plugin; a plain `user` carries no ban state.
  role?: string | string[];
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  twoFactorEnabled?: boolean | null;
  /** Hardcoded `true` until subscriptions land. */
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

// `GET /api/users/me`. Consumed during SSR and by the dashboard sidebar.
export interface GetCurrentLoggedInUser {
  session: CurrentSession;
  user: CurrentUser;
}

// The `status` of `GET /api/users/me/blogs`. Mirrors `MyBlogsStatus` in the
// backend DTO, which is the source of truth.
export enum MyBlogsStatus {
  PUBLISHED = 'published',
  DRAFT = 'draft',
}

// `GET /api/users/me/blogs?status=`. One side per request, published or draft.
export interface GetMyBlogs {
  blogs: Pick<
    Blog,
    | 'id'
    | 'title'
    | 'slug'
    | 'shortDescription'
    | 'tags'
    | 'coverImage'
    | 'isPublished'
    | 'createdAt'
    | '_count'
  >[];
  totalPages: number;
  counts: Record<MyBlogsStatus, number>;
}

/**
 * `GET /api/users/me/comments`. Cursor-paginated, newest first. `nextCursor`
 * is the last id of a full page and `null` on the final page; pass it back as
 * `?cursor=`.
 */
export interface GetMyComments {
  data: (Pick<Comment, 'id' | 'content' | 'createdAt'> & {
    author: Pick<BlogAuthor, 'name' | 'image'>;
    blog: Pick<
      Blog,
      | 'id'
      | 'title'
      | 'slug'
      | 'coverImage'
      | 'isPublished'
      | 'shortDescription'
    > & { author: Pick<BlogAuthor, 'name'> };
  })[];
  nextCursor: string | null;
}

/**
 * One blog as it appears in the dashboard's Likes and Bookmarks tabs. No
 * `isPublished`: unpublished blogs are filtered out server-side, so every row
 * here is safe to link to.
 */
export interface LikesAndBookmarksBlogCard extends Pick<
  Blog,
  | 'id'
  | 'title'
  | 'slug'
  | 'shortDescription'
  | 'tags'
  | 'coverImage'
  | 'createdAt'
  | 'authorId'
> {
  author: Pick<BlogAuthor, 'name' | 'image'>;
}

/**
 * `GET /api/users/me/likes` and `GET /api/users/me/bookmarks` — one shape for
 * both. Offset-paginated at 10 per page, ordered by when the row was saved.
 */
export interface GetMyLikesAndBookmarks {
  blogs: LikesAndBookmarksBlogCard[];
  totalPages: number;
}

/**
 * `PUT /api/users/me`. The profile after the write. `image` is the stored S3
 * key — the GET endpoints are what sign it.
 */
export type UpdateUserProfile = Pick<
  CurrentUser,
  'id' | 'name' | 'email' | 'image' | 'bio' | 'website'
>;
