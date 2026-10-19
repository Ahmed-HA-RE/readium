import type { IconType } from 'react-icons';
import { FaCrown, FaWallet } from 'react-icons/fa';
import { TbCalendarX } from 'react-icons/tb';
import type { AdminDashboardAnalytics } from '@repo/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatBalance } from '@/lib/utils';
import { getDashboardAnalytics } from '@/lib/actions/admin/getDashboardAnalytics';

type PaymentCard = {
  label: string;
  value: string;
  caption: string;
  Icon: IconType;
};

// Fees or refunds can push a balance below zero, which Stripe recovers from later charges.
const getBalanceCaption = (
  balance: AdminDashboardAnalytics['availableBalance'],
) => {
  if (balance === null) return 'Couldn’t reach Stripe';
  if (balance.some(({ amount }) => amount < 0)) return 'Owed to Stripe';
  return 'Ready to pay out';
};

const getCards = (analytics: AdminDashboardAnalytics): PaymentCard[] => [
  {
    label: 'Available Balance',
    // `null` means Stripe couldn't be reached, which isn't the same as an empty balance.
    value:
      analytics.availableBalance === null
        ? 'Unknown'
        : formatBalance(analytics.availableBalance),
    caption: getBalanceCaption(analytics.availableBalance),
    Icon: FaWallet,
  },
  {
    label: 'Active Subscribers',
    value: analytics.totalSubscribers.toLocaleString('en-US'),
    caption: 'Active or on trial',
    Icon: FaCrown,
  },
  {
    label: 'Cancelling Soon',
    value: analytics.cancelingSubscribers.toLocaleString('en-US'),
    caption: 'Ending at their period end',
    Icon: TbCalendarX,
  },
];

// The only consumer of the analytics on this page, so it fetches them itself behind the page's <Suspense>.
const PaymentCards = async () => {
  const analytics = await getDashboardAnalytics();

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {getCards(analytics).map(({ label, value, caption, Icon }) => (
        <Card key={label}>
          <CardContent className='flex flex-col gap-3'>
            <div className='text-muted-foreground flex items-center justify-between gap-2 text-sm font-medium'>
              <span className='truncate'>{label}</span>
              <Icon aria-hidden className='size-4 shrink-0' />
            </div>
            <span className='truncate text-3xl font-semibold tracking-tight tabular-nums'>
              {value}
            </span>
            <span className='text-muted-foreground text-xs'>{caption}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
export default PaymentCards;
