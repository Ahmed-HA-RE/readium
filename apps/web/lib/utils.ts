import { differenceInDays, format, formatDistanceToNow } from 'date-fns';

export { cn } from 'cn';

// Recent posts read as a distance ("5 days ago"), anything
// older switches to a calendar date ("Sep 1").
export const formatPublishedAt = (date: Date | string) => {
  const parsed = new Date(date);

  return differenceInDays(new Date(), parsed) < 30
    ? formatDistanceToNow(parsed, { addSuffix: true })
    : format(parsed, 'MMM d');
};
