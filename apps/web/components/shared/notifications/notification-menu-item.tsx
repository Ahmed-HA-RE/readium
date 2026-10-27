'use client';

import Link from 'next/link';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { GoCheck } from 'react-icons/go';
import { IoEllipsisHorizontalSharp } from 'react-icons/io5';
import type { Notification } from '@repo/types';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import NotificationSummary from '@/components/shared/notifications/notification-summary';
import { useMarkNotificationAsRead } from '@/hooks/notifications';

type NotificationMenuItemProps = {
  notification: Notification;
  href: string;
};

// Clicking the row only navigates; marking read happens through its ellipsis menu.
const NotificationMenuItem = ({
  notification,
  href,
}: NotificationMenuItemProps) => {
  const { markAsRead, isPending } = useMarkNotificationAsRead(notification.id);

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-md',
        !notification.isRead && 'bg-primary/5',
      )}
    >
      <DropdownMenuItem
        render={<Link href={href} />}
        className='flex-1 items-start gap-3 px-2 py-3 not-data-[variant=destructive]:focus:**:text-[revert-rule]'
      >
        <NotificationSummary notification={notification} />
      </DropdownMenuItem>

      {!notification.isRead && (
        <DropdownMenuSub>
          {/* The wrapper's sub trigger always appends a chevron, so the primitive renders a bare icon button. */}
          <MenuPrimitive.SubmenuTrigger
            nativeButton
            openOnHover={false}
            render={
              <Button
                variant='ghost-plain'
                size='icon'
                aria-label='Notification actions'
                className='text-muted-foreground mr-1'
              />
            }
          >
            <IoEllipsisHorizontalSharp className='size-5' />
          </MenuPrimitive.SubmenuTrigger>

          <DropdownMenuSubContent className='w-40'>
            <DropdownMenuItem
              closeOnClick={false}
              disabled={isPending}
              onClick={markAsRead}
            >
              {isPending ? <Spinner /> : <GoCheck />}
              Mark as read
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}
    </div>
  );
};

export default NotificationMenuItem;
