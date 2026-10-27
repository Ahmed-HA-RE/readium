'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { GoBell, GoDotFill } from 'react-icons/go';
import { cn } from 'cn';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationMenuItem from '@/components/shared/notifications/notification-menu-item';
import NotificationsActions from '@/components/shared/notifications/notifications-actions';
import NotificationsDropdownSkeleton from '@/components/shared/notifications/notifications-dropdown-skeleton';
import RetryError from '@/components/shared/retry-error';
import {
  useNotifications,
  useUnreadNotificationsCount,
} from '@/hooks/notifications';
import { getNotificationHref } from '@/lib/notifications';
import { ADMIN_NOTIFICATIONS_PATH, NOTIFICATIONS_PATH } from '@/lib/routes';

const DROPDOWN_LIMIT = 5;

type NotificationsBellProps = {
  username: string;
  isAdmin: boolean;
  className?: string;
};

const NotificationsBell = ({
  username,
  isAdmin,
  className,
}: NotificationsBellProps) => {
  const [open, setOpen] = useState(false);

  const { data: unread } = useUnreadNotificationsCount();
  // Only fetched once the dropdown opens, so the header never pays for the list.
  const { data, isPending, isError, refetch } = useNotifications(open);

  const count = unread?.count ?? 0;
  const notifications = data?.pages[0]?.data.slice(0, DROPDOWN_LIMIT) ?? [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost-plain'
            size='icon-lg'
            className={cn('relative text-muted-foreground', className)}
          />
        }
      >
        <GoBell className='size-5' />
        {count > 0 && (
          <GoDotFill className='absolute top-1 right-1 size-3.5 text-red-500' />
        )}
        <span className='sr-only'>
          {count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-xs sm:w-122'>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='flex items-center justify-between gap-4 pb-2.5'>
            <span className='text-muted-foreground text-sm font-normal uppercase'>
              Notifications
            </span>
            <NotificationsActions />
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='mt-0 h-0.5' />

        {/* `isPending` is only read here: a disabled query with no data also reports pending. */}
        {isPending ? (
          <NotificationsDropdownSkeleton />
        ) : isError ? (
          <RetryError
            message='Could not load your notifications'
            onRetry={() => void refetch()}
            className='py-6'
          />
        ) : notifications.length === 0 ? (
          <p className='text-muted-foreground px-2 py-6 text-center '>
            No notifications yet.
          </p>
        ) : (
          notifications.map((notification, index) => (
            <Fragment key={notification.id}>
              {index > 0 && <DropdownMenuSeparator />}
              <NotificationMenuItem
                notification={notification}
                href={getNotificationHref(notification, username)}
              />
            </Fragment>
          ))
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              render={
                <Link
                  href={isAdmin ? ADMIN_NOTIFICATIONS_PATH : NOTIFICATIONS_PATH}
                />
              }
              className={cn(
                buttonVariants({ variant: 'ghost-plain' }),
                'w-full text-muted-foreground focus:bg-transparent focus:text-foreground',
              )}
            >
              View All
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsBell;
