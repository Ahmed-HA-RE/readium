import { Blog, BlogAuthor } from './blogs';
import { Comment } from './comments';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  banned: boolean | null;
  role: string | null;
  _count: {
    comments: number;
    blogs: number;
  };
}

/** One row of the admin header search; `banned` and `role` drive its badges. */
export type AdminSuggestionUser = Pick<
  User,
  'id' | 'name' | 'image' | 'banned' | 'role'
>;

/** `GET /api/admin/suggestions`. Users only, banned ones and admins included. */
export type GetAdminSuggestions = AdminSuggestionUser[];

export interface GetAllUsersAsAdmin {
  users: User[];
  totalPages: number;
}

export interface UpdateUserAsAdmin extends Pick<
  User,
  'id' | 'name' | 'email' | 'image' | 'createdAt' | 'role' | 'banned'
> {
  website?: string | null;
  bio?: string | null;
}

// Counts only: the blog and comment lists are served by the paginated
// /blogs and /comments endpoints. `_count` drives the "view more" affordance.
export interface GetUserByUsernameAsAdmin extends Pick<
  User,
  'id' | 'name' | 'email' | 'image' | 'createdAt' | 'banned'
> {
  website?: string | null;
  bio?: string | null;
  banReason?: string | null;
  _count: {
    blogs: number;
    comments: number;
    bookmarks: number;
    likes: number;
  };
}

// An admin viewing their own profile has no ban state to moderate, so those
// fields are absent from the /api/admin/me payload.
// Admins don't write, comment, like or bookmark, so their own profile carries no counts.
export interface GetMyDataAsAdmin extends Omit<
  GetUserByUsernameAsAdmin,
  'banned' | 'banReason' | '_count'
> {}

export interface GetUserWithBlogsByUsernameAsAdmin {
  blogs: (Omit<Blog, '_count' | 'updatedAt' | 'authorId'> & {
    author: Pick<BlogAuthor, 'name'>;
  })[];
  totalPages: number;
}

export interface GetUserWithCommentsByUsernameAsAdmin {
  data: (Pick<Comment, 'id' | 'content' | 'createdAt'> & {
    blog: { id: string; title: string; slug: string };
  })[];
  nextCursor: string | null;
}

export interface UpdateAdminSettings extends Omit<
  UpdateUserAsAdmin,
  'role' | 'banned'
> {}

/** In the currency's smallest unit (cents for `usd`), as Stripe returns it. */
export interface StripeBalanceAmount {
  amount: number;
  currency: string;
}

export interface AdminDashboardAnalytics {
  totalUsers: number;
  totalBlogs: number;
  totalReports: number;
  /** Reports still waiting for a review; drives the overview's "Review reports" button. */
  pendingReports: number;
  /** Subscriptions that are `active` or `trialing`. */
  totalSubscribers: number;
  /** Users whose last activity falls within the past 30 days. */
  totalActiveUsers: number;
  /** Stripe's `available` balance, one entry per currency; `null` when Stripe can't be reached. */
  availableBalance: StripeBalanceAmount[] | null;
}
