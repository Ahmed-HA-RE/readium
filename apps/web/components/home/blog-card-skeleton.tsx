import { Skeleton } from '@/components/ui/skeleton';

// Mirrors `blog-card.tsx` so the feed does not jump when the real cards land.
const BlogCardSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className='divide-y'>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className='flex gap-8 py-8 max-sm:flex-col'>
        <Skeleton className='h-41 w-49 shrink-0 rounded-lg max-sm:order-last max-sm:w-full' />

        <div className='flex min-w-0 flex-1 flex-col gap-3'>
          <div className='flex gap-1.5'>
            <Skeleton className='h-5 w-16 rounded-full' />
            <Skeleton className='h-5 w-20 rounded-full' />
          </div>

          <Skeleton className='h-6 w-3/4' />

          <div className='flex flex-col gap-1.5'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
          </div>

          <div className='flex items-center gap-3'>
            <Skeleton className='size-10 rounded-full' />
            <div className='flex flex-col gap-1.5'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-3 w-20' />
            </div>
          </div>

          <Skeleton className='mt-2 h-9 w-32 rounded-lg' />
        </div>
      </div>
    ))}
  </div>
);

export default BlogCardSkeleton;
