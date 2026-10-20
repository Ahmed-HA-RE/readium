import Link from 'next/link';
import { format } from 'date-fns';
import { TfiArrowTopRight } from 'react-icons/tfi';
import type { Subscription } from '@better-auth/stripe';
import { SITE_NAME } from '@/lib/constants';
import { PLANS_PATH } from '@/lib/routes';
import BillingPortalRow from './billing-portal-row';

type MembershipSettingsProps = {
  isPro: boolean;
  subscription: Subscription | null;
};

const formatDate = (date: Date | string) => format(date, 'MMMM d, yyyy');

const getPlanSummary = ({
  billingInterval,
  periodEnd,
  cancelAt,
  cancelAtPeriodEnd,
  stripeScheduleId,
}: Subscription) => {
  const endsAt = cancelAt ?? periodEnd;
  if ((cancelAt || cancelAtPeriodEnd) && endsAt)
    return `Your membership ends on ${formatDate(endsAt)}. You won't be charged again.`;
  if (!periodEnd) return 'Your membership is active.';
  if (stripeScheduleId)
    return `Switches to ${billingInterval === 'year' ? 'monthly' : 'yearly'} on ${formatDate(periodEnd)}.`;
  return `Renews on ${formatDate(periodEnd)}.`;
};

const MembershipSettings = ({ isPro, subscription }: MembershipSettingsProps) => (
  <section className='flex flex-col divide-y pt-2 *:py-5'>
    {!isPro && (
      <Link
        href={PLANS_PATH}
        className='flex w-full items-start justify-between gap-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
      >
        <span className='flex min-w-0 flex-col gap-1'>
          <span className='text-base'>Upgrade to a {SITE_NAME} Membership</span>
          <span className='text-sm text-muted-foreground'>
            Subscribe for unlimited access to every Pro story and the writers
            behind them on {SITE_NAME}.
          </span>
        </span>
        <TfiArrowTopRight
          aria-hidden
          className='shrink-0 text-muted-foreground'
        />
      </Link>
    )}

    {isPro && subscription && (
      <>
        <div className='flex w-full items-start justify-between gap-5'>
          <span className='flex min-w-0 flex-col gap-1'>
            <span className='text-base'>{SITE_NAME} Pro</span>
            <span className='text-sm text-muted-foreground'>
              {getPlanSummary(subscription)}
            </span>
          </span>
          <span className='shrink-0 text-sm text-muted-foreground'>
            {subscription.billingInterval === 'year' ? 'Yearly' : 'Monthly'}
          </span>
        </div>
        <BillingPortalRow
          title='Manage membership'
          summary='Switch plans, cancel, update your payment method or download receipts.'
        />
      </>
    )}
  </section>
);

export default MembershipSettings;
