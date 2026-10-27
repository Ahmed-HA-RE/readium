import { type Notification, NotificationType } from '@repo/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { formatPublishedAt } from '@/lib/utils';

const NOTIFICATION_COPY: Record<NotificationType, { verb: string; label: string }> = {
  [NotificationType.NEW_LIKE]: { verb: 'liked your story', label: 'New like' },
  [NotificationType.NEW_COMMENT]: {
    verb: 'responded to your story',
    label: 'New response',
  },
  [NotificationType.NEW_REPORT]: { verb: 'reported', label: 'New report' },
};

// The avatar and text of one notification, shared by the dropdown rows and the notifications page cards.
const NotificationSummary = ({
  notification,
}: {
  notification: Notification;
}) => {
  const { actor, blog, type, createdAt } = notification;
  const { verb, label } = NOTIFICATION_COPY[type];

  return (
    <>
      <Avatar className='size-9.5'>
        <AvatarImage src={actor.image ?? DEFAULT_AVATAR} alt={actor.name} />
        <AvatarFallback>
          <Skeleton className='size-full rounded-full' />
        </AvatarFallback>
      </Avatar>
      <div className='flex min-w-0 flex-1 flex-col items-start gap-1'>
        <p className='line-clamp-2 text-sm'>
          <span className='font-medium'>{actor.name}</span> {verb}{' '}
          <span className='font-medium'>{blog.title}</span>
        </p>
        <div className='flex items-center gap-2.5'>
          <span className='text-muted-foreground text-xs'>
            {formatPublishedAt(createdAt)}
          </span>
          <div className='bg-primary/30 size-1.5 rounded-full' />
          <span className='text-muted-foreground text-xs'>{label}</span>
        </div>
      </div>
    </>
  );
};

export default NotificationSummary;
