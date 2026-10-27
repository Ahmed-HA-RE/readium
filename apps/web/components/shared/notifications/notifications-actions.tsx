'use client';

import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  useMarkAllNotificationsAsRead,
  useUnreadNotificationsCount,
} from '@/hooks/notifications';

// The "N New" badge and Mark all as read, shared by the bell's dropdown and the notifications pages.
const NotificationsActions = ({ className }: { className?: string }) => {
  const { data: unread, isPending: isCountPending } =
    useUnreadNotificationsCount();
  const { markAllAsRead, isPending } = useMarkAllNotificationsAsRead();

  const count = unread?.count ?? 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isCountPending ? (
        <Skeleton className='h-5 w-14 rounded-full' />
      ) : (
        <Badge
          variant='secondary'
          className='bg-primary/10 text-primary font-normal'
        >
          {count} New
        </Badge>
      )}
      <Button
        variant='ghost-plain'
        size='sm'
        disabled={count === 0 || isPending}
        onClick={markAllAsRead}
      >
        {isPending && <Spinner className='size-3.5' />}
        Mark all as read
      </Button>
    </div>
  );
};

export default NotificationsActions;
