'use client';

import { useState } from 'react';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YEARLY_SAVINGS, type BillingPeriod } from '@/lib/plans';
import PricingTable from './pricing-table';

const billingTabClassName =
  'h-auto rounded-none border-border bg-muted px-8 py-2 text-lg first:rounded-l-md last:rounded-r-md data-active:border-foreground data-active:bg-background group-data-[variant=default]/tabs-list:data-active:shadow-none dark:data-active:border-foreground dark:data-active:bg-background';

const PlansPricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');

  return (
    <div className='flex w-full flex-col items-center gap-8'>
      <Tabs
        value={billingPeriod}
        onValueChange={(value) => setBillingPeriod(value as BillingPeriod)}
        className='w-full sm:w-auto'
      >
        <TabsList className='w-full items-stretch gap-0 rounded-md bg-transparent p-0 group-data-horizontal/tabs:h-auto sm:w-auto'>
          <TabsTrigger value='monthly' className={billingTabClassName}>
            Monthly
          </TabsTrigger>
          <TabsTrigger
            value='yearly'
            className={cn(billingTabClassName, 'flex-col gap-1 py-1.5')}
          >
            <Badge variant='app' shape='rectangle'>
              Save up to ${YEARLY_SAVINGS}
            </Badge>
            Yearly
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <PricingTable billingPeriod={billingPeriod} />
    </div>
  );
};

export default PlansPricing;
