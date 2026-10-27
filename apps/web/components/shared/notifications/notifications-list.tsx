'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import { GoBell } from 'react-icons/go';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import NotificationCard from '@/components/shared/notifications/notification-card';
import NotificationsListSkeleton from '@/components/shared/notifications/notifications-list-skeleton';
import RetryError from '@/components/shared/retry-error';
import { useNotifications } from '@/hooks/notifications';
import { getNotificationHref } from '@/lib/notifications';
import { NEW_STORY_PATH } from '@/lib/routes';

type NotificationsListProps = {
  username: string;
  // Admins only receive reports and cannot write, so their empty state has no link.
  isAdmin: boolean;
};

const NotificationsList = ({ username, isAdmin }: NotificationsListProps) => {
  const {
    data,
    isPending,
    isError,
    isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useNotifications(true);

  // Starts the next page a little before the sentinel scrolls into view.
  const { ref, inView } = useInView({ rootMargin: '200px' });

  // Re-runs when a page finishes, so a sentinel still on screen keeps loading.
  // `isError` stops a failing page being re-requested in a loop.
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isError) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  if (isPending) return <NotificationsListSkeleton />;

  // A failed later page keeps the rows already loaded, handled below.
  if (isError && !isFetchNextPageError) {
    return (
      <RetryError
        message='Something went wrong loading your notifications.'
        onRetry={() => refetch()}
      />
    );
  }

  const notifications = data.pages.flatMap((page) => page.data);

  if (notifications.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 py-16 text-center'>
        <span className='bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full'>
          <GoBell className='size-6' />
        </span>
        <p className='text-lg font-medium'>No notifications yet.</p>
        <p className='text-muted-foreground max-w-sm text-sm'>
          {isAdmin
            ? 'When readers report a story, you will see it here.'
            : 'When readers like or respond to your stories, you will see it here.'}
        </p>
        {!isAdmin && (
          <Link
            href={NEW_STORY_PATH}
            className='text-primary mt-2 text-sm font-medium hover:underline'
          >
            Write a story
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className='flex flex-col gap-2.5'>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            href={getNotificationHref(notification, username)}
          />
        ))}
      </div>

      {isFetchNextPageError ? (
        <div className='flex flex-col items-center gap-3 py-6'>
          <p className='text-muted-foreground text-sm'>
            Could not load more notifications.
          </p>
          <Button variant='outline' onClick={() => fetchNextPage()}>
            Try again
          </Button>
        </div>
      ) : (
        hasNextPage && (
          <div ref={ref} className='flex justify-center py-6'>
            {isFetchingNextPage && <Spinner />}
          </div>
        )
      )}
    </>
  );
};

export default NotificationsList;
