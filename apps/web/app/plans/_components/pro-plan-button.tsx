'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { FaArrowRight } from 'react-icons/fa6';
import { authClient } from '@/lib/auth-client';
import { toAbsoluteUrl } from '@/lib/absolute-url';
import { getMySettingsPath, PLANS_PATH } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { BillingPeriod } from '@/lib/plans';

const MEMBERSHIP_URL = `${getMySettingsPath('membership')}&payment`;

type ProPlanButtonProps = {
  billingPeriod: BillingPeriod;
  isAdmin: boolean;
};

// Members are redirected off `/plans` and switch plans in the billing portal, so this only starts checkout.
const ProPlanButton = ({ billingPeriod, isAdmin }: ProPlanButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const subscribe = () => {
    startTransition(async () => {
      const { error } = await authClient.subscription.upgrade({
        plan: 'pro',
        annual: billingPeriod === 'yearly',
        successUrl: toAbsoluteUrl(MEMBERSHIP_URL),
        cancelUrl: toAbsoluteUrl(PLANS_PATH),
      });

      if (error) toast.error(error.message);
    });
  };

  return (
    <Button
      variant='ghost'
      disabled={isAdmin || isPending}
      onClick={subscribe}
      className='gap-1 px-4 text-sm font-medium text-foreground'
    >
      {isPending ? (
        <Spinner />
      ) : isAdmin ? (
        'Included with admin access'
      ) : (
        <>
          Select
          <FaArrowRight className='size-3.5' />
        </>
      )}
    </Button>
  );
};

export default ProPlanButton;
