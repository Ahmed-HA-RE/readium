import { Skeleton } from '@/components/ui/skeleton';


const BlogPageSkeleton = () => (
  <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8'>
    <Skeleton className='aspect-[40/21] max-h-120 w-full rounded-lg' />

    <div className='mx-auto flex w-full max-w-170 flex-col gap-8'>
      <div className='flex flex-col gap-6'>
        <div className='flex gap-1.5'>
          <Skeleton className='h-5 w-16 rounded-full' />
          <Skeleton className='h-5 w-20 rounded-full' />
          <Skeleton className='h-5 w-14 rounded-full' />
        </div>

        <div className='flex flex-col gap-3'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-2/3' />
        </div>

        <div className='flex items-center gap-3'>
          <Skeleton className='size-10 rounded-full' />
          <Skeleton className='h-4 w-56' />
        </div>

        <div className='flex items-center justify-between border-y py-2.5'>
          <div className='flex gap-4'>
            <Skeleton className='h-6 w-12' />
            <Skeleton className='h-6 w-12' />
          </div>
          <div className='flex gap-3'>
            <Skeleton className='size-6' />
            <Skeleton className='h-6 w-16' />
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-8'>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className='flex flex-col gap-2.5'>
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-5 w-11/12' />
            <Skeleton className='h-5 w-3/5' />
          </div>
        ))}
      </div>

      <div className='flex flex-col gap-6'>
        <Skeleton className='h-7 w-40' />
        <Skeleton className='h-28 w-full rounded-lg' />

        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className='flex gap-3'>
            <Skeleton className='size-8 shrink-0 rounded-full' />
            <div className='flex flex-1 flex-col gap-2'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-4 w-full' />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default BlogPageSkeleton;
