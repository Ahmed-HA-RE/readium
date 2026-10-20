import type { MyBlogsStatus } from '@repo/types';
import type { SettingsTab } from '@/lib/search-params';

// Auth

export const LOGIN_PATH = '/login';

export const SIGN_UP_PATH = '/sign-up';

export const FORGOT_PASSWORD_PATH = '/forgot-password';

// After signing in, the user is sent back to `callbackUrl`.
export const getLoginPath = (callbackUrl: string) =>
  `${LOGIN_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

export const getSignUpPath = (callbackUrl: string) =>
  `${SIGN_UP_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

// Public

export const PLANS_PATH = '/plans';

export const getProfilePath = (name: string) => `/@${encodeURIComponent(name)}`;

export const getBlogPath = (authorName: string, slug: string) =>
  `${getProfilePath(authorName)}/${encodeURIComponent(slug)}`;

// Author

export const NEW_STORY_PATH = '/new-story';

export const NOTIFICATIONS_PATH = '/notifications';

export const MY_STORIES_PATH = '/me/stories';

export const MY_LISTS_PATH = '/me/lists';

export const getBlogEditPath = (slug: string) =>
  `${MY_STORIES_PATH}/${encodeURIComponent(slug)}/edit`;

// One tab of the author's stories dashboard.
export const getMyStoriesPath = (status: MyBlogsStatus) =>
  `${MY_STORIES_PATH}?status=${status}`;

export const getMySettingsPath = (tab?: SettingsTab) =>
  tab ? `/me/settings?tab=${tab}` : '/me/settings';

// Admin

export const ADMIN_OVERVIEW_PATH = '/admin/dashboard';

export const ADMIN_PAYMENTS_PATH = '/admin/dashboard/payments';

export const ADMIN_SETTINGS_PATH = '/admin/dashboard/settings';

export const ADMIN_NOTIFICATIONS_PATH = '/admin/dashboard/notifications';

export const ADMIN_BLOGS_PATH = '/admin/dashboard/blogs';

export const ADMIN_USERS_PATH = '/admin/dashboard/users';

export const ADMIN_REPORTS_PATH = '/admin/dashboard/reports';

export const getAdminUserPath = (name: string) =>
  `${ADMIN_USERS_PATH}/${encodeURIComponent(name)}`;

export const getAdminBlogPath = (slug: string) =>
  `${ADMIN_BLOGS_PATH}/${encodeURIComponent(slug)}`;
