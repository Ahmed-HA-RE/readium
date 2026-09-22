import axios from 'axios';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';

export { cn } from 'cn';

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error)) {
    return fallback;
  }

  const { message } = error.response?.data ?? {};

  return (Array.isArray(message) ? message[0] : message) || fallback;
};

// Recent posts read as a distance ("5 days ago"), anything
// older switches to a calendar date ("Sep 1").
export const formatPublishedAt = (date: Date | string) => {
  const parsed = new Date(date);

  return differenceInDays(new Date(), parsed) < 30
    ? formatDistanceToNow(parsed, { addSuffix: true })
    : format(parsed, 'MMM d');
};
