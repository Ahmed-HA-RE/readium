import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

const PaymentCardSkeleton = () => {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index}>
          <CardContent className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='size-4' />
            </div>
            <Skeleton className='h-9 w-28' />
            <Skeleton className='h-3 w-36' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PaymentCardSkeleton;
