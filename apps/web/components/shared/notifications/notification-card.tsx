'use client';

import Link from 'next/link';
import { GoCheck } from 'react-icons/go';
import { IoEllipsisHorizontalSharp } from 'react-icons/io5';
import type { Notification } from '@repo/types';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import NotificationSummary from '@/components/shared/notifications/notification-summary';
import { useMarkNotificationAsRead } from '@/hooks/notifications';

type NotificationCardProps = {
  notification: Notification;
  href: string;
};

// The notifications page's row; like the dropdown's, clicking it only navigates.
const NotificationCard = ({ notification, href }: NotificationCardProps) => {
  const { markAsRead, isPending } = useMarkNotificationAsRead(notification.id);

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg',
        !notification.isRead && 'bg-primary/5',
      )}
    >
      <Link
        href={href}
        className='flex min-w-0 flex-1 items-start gap-3 px-3 py-3.5'
      >
        <NotificationSummary notification={notification} />
      </Link>

      {!notification.isRead && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost-plain'
                size='icon-lg'
                aria-label='Notification actions'
                className='text-muted-foreground mr-1'
              />
            }
          >
            <IoEllipsisHorizontalSharp className='size-5' />
          </DropdownMenuTrigger>

          <DropdownMenuContent align='end' className='w-40'>
            <DropdownMenuItem disabled={isPending} onClick={markAsRead}>
              {isPending ? <Spinner /> : <GoCheck />}
              Mark as read
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default NotificationCard;
