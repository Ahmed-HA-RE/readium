import { DEFAULT_ADMIN_TABLE_PAGE_SIZE } from '@repo/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CARD_COUNT = 6;

// Mirrors `OverviewTableCard`: a title, then a bordered table ending in the "View all" link.
const TableCardSkeleton = () => (
  <div className='flex min-w-0 flex-col gap-4'>
    <Skeleton className='h-8 w-44' />
    <div className='flex flex-col rounded-xl border'>
      <div className='flex items-center gap-4 border-b px-4 py-3'>
        <Skeleton className='h-4 flex-1' />
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-4 w-16' />
      </div>
      {Array.from({ length: DEFAULT_ADMIN_TABLE_PAGE_SIZE }, (_, index) => (
        <div
          key={index}
          className='flex items-center gap-4 border-b px-4 py-3 last:border-b-0'
        >
          <Skeleton className='size-9 shrink-0 rounded-full' />
          <div className='flex flex-1 flex-col gap-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
          <Skeleton className='h-5 w-16 rounded-full' />
          <Skeleton className='size-8 rounded-md' />
        </div>
      ))}
      <div className='flex justify-end border-t px-4 py-3'>
        <Skeleton className='h-4 w-28' />
      </div>
    </div>
  </div>
);

const AdminOverviewLoading = () => (
  <div className='flex flex-col gap-10' aria-busy='true' aria-label='Loading dashboard'>
    <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
      <Skeleton className='h-9 w-72 lg:h-10' />
      <Skeleton className='h-10 w-36 rounded-md' />
    </div>

    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <Card key={index}>
          <CardContent className='flex items-center gap-4'>
            <Skeleton className='size-12 shrink-0 rounded-lg' />
            <div className='flex flex-1 flex-col gap-2'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-7 w-20' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className='grid gap-10 xl:grid-cols-2 xl:gap-6'>
      <TableCardSkeleton />
      <TableCardSkeleton />
    </div>

    <TableCardSkeleton />
  </div>
);

export default AdminOverviewLoading;
