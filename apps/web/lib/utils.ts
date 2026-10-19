import axios from 'axios';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { MyBlogsStatus, StripeBalanceAmount } from '@repo/types';

export { cn } from 'cn';

export const copyToClipboard = async (text: string, message: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error('Could not copy to the clipboard');
  }
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const { message } = error.response?.data ?? {};

  return (Array.isArray(message) ? message[0] : message) || fallback;
};

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

// Decimal units, matching the 5MB (5,000,000 byte) upload limit.
export const formatFileSize = (bytes: number) =>
  bytes < 1_000_000
    ? `${Math.max(1, Math.round(bytes / 1000))} KB`
    : `${(bytes / 1_000_000).toFixed(1)} MB`;

const WORDS_PER_MINUTE = 200;

// Takes the API's `wordCount`, since a locked pro blog only ships half its body.
export const getReadingTime = (wordCount: number) =>
  Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

// Recent posts read as a distance ("5 days ago"), anything
// older switches to a calendar date ("Sep 1").
export const formatPublishedAt = (date: Date | string) => {
  const parsed = new Date(date);

  return differenceInDays(new Date(), parsed) < 30
    ? formatDistanceToNow(parsed, { addSuffix: true })
    : format(parsed, 'MMM d');
};

// Stripe sends the smallest unit (cents), so it's divided by the currency's own decimal places.
export const formatBalance = (balance: StripeBalanceAmount[] | null) => {
  if (!balance?.length) return '—';

  return balance
    .map(({ amount, currency }) => {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      });
      const { maximumFractionDigits = 2 } = formatter.resolvedOptions();
      return formatter.format(amount / 10 ** maximumFractionDigits);
    })
    .join(' · ');
};
