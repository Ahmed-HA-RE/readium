import { Fragment } from 'react';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

// Mirrors `NotificationMenuItem`: avatar, two text lines and the ellipsis button.
const NotificationsDropdownSkeleton = () =>
  Array.from({ length: 3 }, (_, index) => (
    <Fragment key={index}>
      {index > 0 && <DropdownMenuSeparator />}
      <div className='flex items-start gap-3 px-2 py-3'>
        <Skeleton className='size-9.5 shrink-0 rounded-full' />
        <div className='flex flex-1 flex-col gap-2'>
          <Skeleton className='h-4 w-4/5' />
          <Skeleton className='h-3 w-1/3' />
        </div>
        <Skeleton className='size-8 shrink-0 rounded-md' />
      </div>
    </Fragment>
  ));

export default NotificationsDropdownSkeleton;
