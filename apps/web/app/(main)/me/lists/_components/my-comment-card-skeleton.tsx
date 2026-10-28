import { Skeleton } from '@/components/ui/skeleton';

// Mirrors `my-comment-card.tsx` so the list does not jump when the cards land.
const MyCommentCardSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className='divide-y'>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className='flex flex-col gap-4 py-6'>
        <div className='flex items-center gap-3'>
          <Skeleton className='size-16 shrink-0 rounded-md' />
          <div className='flex flex-col gap-1.5'>
            <Skeleton className='h-4 w-64 max-w-full' />
            <Skeleton className='h-3 w-32' />
          </div>
        </div>

        <div className='flex flex-col gap-1.5 border-l-2 pl-4'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
        </div>
      </div>
    ))}
  </div>
);

export default MyCommentCardSkeleton;
