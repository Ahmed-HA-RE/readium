import {
  createLoader,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
} from 'nuqs/server';
import { AdminBlogStatus, BlogSortOptions, MyBlogsStatus } from '@repo/types';
import {
  ADMIN_TABLE_PAGE_SIZES,
  DEFAULT_ADMIN_TABLE_PAGE_SIZE,
} from '@repo/constants';

const sortParser = parseAsStringEnum<BlogSortOptions>(
  Object.values(BlogSortOptions),
).withDefault(BlogSortOptions.NEWEST);

const pageParser = parseAsInteger.withDefault(1);

export const blogFeedParsers = {
  sort: sortParser,
  page: pageParser,
};

export const loadBlogFeedSearchParams = createLoader(blogFeedParsers);

export const myStoriesParsers = {
  status: parseAsStringEnum<MyBlogsStatus>(
    Object.values(MyBlogsStatus),
  ).withDefault(MyBlogsStatus.DRAFT),
  search: parseAsString.withDefault(''),
  sort: sortParser,
  page: pageParser,
};

export const loadMyStoriesSearchParams = createLoader(myStoriesParsers);

const adminTableLimitParser = parseAsNumberLiteral(
  ADMIN_TABLE_PAGE_SIZES,
).withDefault(DEFAULT_ADMIN_TABLE_PAGE_SIZE);

// No default on `status`: absent means "All statuses", which the request leaves out.
export const adminBlogsParsers = {
  search: parseAsString.withDefault(''),
  status: parseAsStringEnum<AdminBlogStatus>(Object.values(AdminBlogStatus)),
  page: pageParser,
  limit: adminTableLimitParser,
};

export const ADMIN_USER_STATUSES = ['banned', 'active'] as const;

export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];

// No default on `status`: absent means "All statuses", which the request leaves out.
export const adminUsersParsers = {
  search: parseAsString.withDefault(''),
  status: parseAsStringLiteral(ADMIN_USER_STATUSES),
  page: pageParser,
  limit: adminTableLimitParser,
};

export const userBlogsParsers = {
  search: parseAsString.withDefault(''),
  sort: sortParser,
  page: pageParser,
};

export const LISTS_TABS = ['bookmarks', 'likes', 'comments'] as const;

export type ListsTab = (typeof LISTS_TABS)[number];

export const listsParsers = {
  tab: parseAsStringLiteral(LISTS_TABS).withDefault('bookmarks'),
  page: pageParser,
};

export const loadListsSearchParams = createLoader(listsParsers);

// Later phases add their tabs here.
export const SETTINGS_TABS = ['account', 'security', 'membership'] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export const settingsParsers = {
  tab: parseAsStringLiteral(SETTINGS_TABS).withDefault('account'),
};
