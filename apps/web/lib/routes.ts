import type { MyBlogsStatus } from '@repo/types';

export const getProfilePath = (name: string) => `/@${encodeURIComponent(name)}`;

export const getBlogPath = (authorName: string, slug: string) =>
  `${getProfilePath(authorName)}/${encodeURIComponent(slug)}`;

export const ADMIN_OVERVIEW_PATH = '/admin/dashboard';

export const ADMIN_PAYMENTS_PATH = '/admin/dashboard/payments';

export const ADMIN_SETTINGS_PATH = '/admin/dashboard/settings';

export const ADMIN_NOTIFICATIONS_PATH = '/admin/dashboard/notifications';

export const ADMIN_BLOGS_PATH = '/admin/dashboard/blogs';

export const ADMIN_USERS_PATH = '/admin/dashboard/users';

export const ADMIN_REPORTS_PATH = '/admin/dashboard/reports';

export const getBlogEditPath = (slug: string) =>
  `/me/stories/${encodeURIComponent(slug)}/edit`;

// One tab of the author's stories dashboard.
export const getMyStoriesPath = (status: MyBlogsStatus) =>
  `/me/stories?status=${status}`;
