import { createLoader, parseAsInteger, parseAsStringEnum } from 'nuqs/server';
import { BlogSortOptions } from '@repo/types';

export const blogFeedParsers = {
  sort: parseAsStringEnum<BlogSortOptions>(
    Object.values(BlogSortOptions),
  ).withDefault(BlogSortOptions.NEWEST),
  page: parseAsInteger.withDefault(1),
};

export const loadBlogFeedSearchParams = createLoader(blogFeedParsers);
