'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { FaArrowRight } from 'react-icons/fa6';
import type { Subscription } from '@better-auth/stripe';
import { authClient } from '@/lib/auth-client';
import { toAbsoluteUrl } from '@/lib/absolute-url';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { BillingPeriod } from '@/lib/plans';

const MEMBERSHIP_URL = '/me/settings?tab=membership&payment';

type ProPlanButtonProps = {
  billingPeriod: BillingPeriod;
  activeSubscription: Subscription | null;
  isAdmin: boolean;
};

const ProPlanButton = ({
  billingPeriod,
  activeSubscription,
  isAdmin,
}: ProPlanButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const isYearly = billingPeriod === 'yearly';
  const isCurrentPlan =
    activeSubscription?.billingInterval === (isYearly ? 'year' : 'month');
  const hasScheduledSwitch = !!activeSubscription?.stripeScheduleId;
  const isActionable = !isAdmin && !isCurrentPlan && !hasScheduledSwitch;

  const getLabel = () => {
    if (isAdmin) return 'Included with admin access';
    if (isCurrentPlan) return 'Current plan';
    if (hasScheduledSwitch) return 'Switch scheduled';
    if (activeSubscription) return `Switch to ${billingPeriod}`;
    return 'Select';
  };

  const subscribe = () => {
    startTransition(async () => {
      const { error } = await authClient.subscription.upgrade({
        plan: 'pro',
        annual: isYearly,
        successUrl: toAbsoluteUrl(MEMBERSHIP_URL),
        cancelUrl: toAbsoluteUrl('/plans'),
        // Members switch at the end of their current period; without the ID Stripe would start a second subscription.
        ...(activeSubscription && {
          subscriptionId: activeSubscription.stripeSubscriptionId,
          scheduleAtPeriodEnd: true,
          returnUrl: toAbsoluteUrl(MEMBERSHIP_URL),
        }),
      });

      if (error) toast.error(error.message);
    });
  };

  return (
    <Button
      variant='ghost'
      disabled={!isActionable || isPending}
      onClick={subscribe}
      className='gap-1 px-4 text-sm font-medium text-foreground'
    >
      {isPending ? (
        <Spinner />
      ) : (
        <>
          {getLabel()}
          {isActionable && <FaArrowRight className='size-3.5' />}
        </>
      )}
    </Button>
  );
};

export default ProPlanButton;
