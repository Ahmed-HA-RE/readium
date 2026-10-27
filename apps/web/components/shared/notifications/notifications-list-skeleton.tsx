import { Skeleton } from '@/components/ui/skeleton';

// Mirrors `notification-card.tsx` so the list does not jump when the cards land.
const NotificationsListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className='flex flex-col gap-2.5'>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className='flex items-start gap-3 px-3 py-3.5'>
        <Skeleton className='size-9.5 shrink-0 rounded-full' />
        <div className='flex flex-1 flex-col gap-2 pt-0.5'>
          <Skeleton className='h-4 w-4/5' />
          <Skeleton className='h-3 w-1/3' />
        </div>
      </div>
    ))}
  </div>
);

export default NotificationsListSkeleton;
