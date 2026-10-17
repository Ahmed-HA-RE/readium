import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CARD_COUNT = 6;

export const PendingReportsSkeleton = () => (
  <Skeleton className='h-10 w-36 rounded-md' />
);

export const AnalyticsCardsSkeleton = () => (
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
);
