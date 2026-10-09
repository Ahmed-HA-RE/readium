'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { TfiArrowTopRight } from 'react-icons/tfi';
import { authClient } from '@/lib/auth-client';
import { toAbsoluteUrl } from '@/lib/absolute-url';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type BillingPortalRowProps = {
  title: string;
  summary: string;
};

// Opens Stripe's billing portal, where members switch plans, cancel, and manage payment.
const BillingPortalRow = ({ title, summary }: BillingPortalRowProps) => {
  const [isPending, startTransition] = useTransition();

  const openPortal = () => {
    startTransition(async () => {
      const { error } = await authClient.subscription.billingPortal({
        returnUrl: toAbsoluteUrl('/me/settings?tab=membership'),
      });

      if (error) toast.error(error.message);
    });
  };

  return (
    <div>
      <Button
        type='button'
        variant='ghost-plain'
        onClick={openPortal}
        disabled={isPending}
        className='h-auto w-full items-start justify-between gap-5 rounded-none border-0 p-0 text-left font-normal whitespace-normal'
      >
        <span className='flex min-w-0 flex-col gap-1'>
          <span className='text-base'>{title}</span>
          <span className='text-sm text-muted-foreground'>{summary}</span>
        </span>
        {isPending ? (
          <Spinner className='text-muted-foreground' />
        ) : (
          <TfiArrowTopRight aria-hidden className='text-muted-foreground' />
        )}
      </Button>
    </div>
  );
};

export default BillingPortalRow;
