import axios from 'axios';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import type { MyBlogsStatus } from '@repo/types';

export { cn } from 'cn';

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error)) {
    return fallback;
  }

  const { message } = error.response?.data ?? {};

  return (Array.isArray(message) ? message[0] : message) || fallback;
};

// Blog content is HTML, so excerpts and word counts strip the tags first.
export const htmlToText = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getProfilePath = (name: string) =>
  `/@${encodeURIComponent(name)}`;

export const getBlogPath = (authorName: string, slug: string) =>
  `${getProfilePath(authorName)}/${encodeURIComponent(slug)}`;

export const ADMIN_MY_STORIES_PATH = '/admin/dashboard/me/stories';

export const ADMIN_MY_LISTS_PATH = '/admin/dashboard/me/lists';

export const ADMIN_PROFILE_PATH = '/admin/dashboard/profile';

export const ADMIN_SETTINGS_PATH = '/admin/dashboard/settings';

export const getBlogEditPath = (slug: string) =>
  `/me/stories/${encodeURIComponent(slug)}/edit`;

// One tab of the author's stories dashboard.
export const getMyStoriesPath = (status: MyBlogsStatus) =>
  `/me/stories?status=${status}`;

// Decimal units, matching the 5MB (5,000,000 byte) upload limit.
export const formatFileSize = (bytes: number) =>
  bytes < 1_000_000
    ? `${Math.max(1, Math.round(bytes / 1000))} KB`
    : `${(bytes / 1_000_000).toFixed(1)} MB`;

const WORDS_PER_MINUTE = 200;

export const getReadingTime = (html: string) => {
  const words = htmlToText(html).split(' ').filter(Boolean).length;

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};

// Recent posts read as a distance ("5 days ago"), anything
// older switches to a calendar date ("Sep 1").
export const formatPublishedAt = (date: Date | string) => {
  const parsed = new Date(date);

  return differenceInDays(new Date(), parsed) < 30
    ? formatDistanceToNow(parsed, { addSuffix: true })
    : format(parsed, 'MMM d');
};
