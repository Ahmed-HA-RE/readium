import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
} from 'nuqs/server';
import { BlogSortOptions, MyBlogsStatus } from '@repo/types';

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

export const LISTS_TABS = ['bookmarks', 'likes', 'comments'] as const;

export type ListsTab = (typeof LISTS_TABS)[number];

export const listsParsers = {
  tab: parseAsStringLiteral(LISTS_TABS).withDefault('bookmarks'),
  page: pageParser,
};

export const loadListsSearchParams = createLoader(listsParsers);
