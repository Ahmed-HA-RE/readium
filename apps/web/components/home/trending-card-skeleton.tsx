import { Skeleton } from '@/components/ui/skeleton';

const TrendingCardSkeleton = ({ count = 5 }: { count?: number }) =>
  Array.from({ length: count }, (_, index) => (
    <div key={index} className='flex flex-col gap-1.5'>
      <div className='flex items-center gap-2'>
        <Skeleton className='size-6 rounded-full' />
        <Skeleton className='h-4 w-24' />
      </div>

      <Skeleton className='h-5 w-full' />
      <Skeleton className='h-5 w-2/3' />

      <div className='flex flex-col gap-1.5'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-5/6' />
      </div>

      <Skeleton className='h-3 w-16' />
    </div>
  ));

export default TrendingCardSkeleton;
