import type { IconType } from 'react-icons';
import { FaCrown, FaUserCheck, FaUsers } from 'react-icons/fa';
import { FaMoneyBillTrendUp, FaNewspaper } from 'react-icons/fa6';
import { TbReportSearch } from 'react-icons/tb';
import type { AdminDashboardAnalytics, StripeBalanceAmount } from '@repo/types';
import { cn } from 'cn';
import { Card, CardContent } from '@/components/ui/card';

type AnalyticCard = {
  label: string;
  value: string;
  Icon: IconType;
  // Full class names, so Tailwind picks them up at build time.
  iconClassName: string;
};

// Stripe sends the smallest unit (cents), so it's divided by the currency's own decimal places.
const formatBalance = (balance: StripeBalanceAmount[] | null) => {
  if (!balance?.length) return '—';

  return balance
    .map(({ amount, currency }) => {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      });
      const { maximumFractionDigits = 2 } = formatter.resolvedOptions();
      return formatter.format(amount / 10 ** maximumFractionDigits);
    })
    .join(' · ');
};

const getCards = (analytics: AdminDashboardAnalytics): AnalyticCard[] => [
  {
    label: 'Total Users',
    value: analytics.totalUsers.toLocaleString('en-US'),
    Icon: FaUsers,
    iconClassName:
      'text-teal-500 bg-teal-200 dark:bg-teal-500/20 dark:text-teal-400',
  },
  {
    label: 'Total Blogs',
    value: analytics.totalBlogs.toLocaleString('en-US'),
    Icon: FaNewspaper,
    iconClassName:
      'text-amber-500 bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400',
  },
  {
    label: 'Total Reports',
    value: analytics.totalReports.toLocaleString('en-US'),
    Icon: TbReportSearch,
    iconClassName:
      'text-blue-500 bg-blue-200 dark:bg-blue-500/20 dark:text-blue-400',
  },
  {
    label: 'Total Active Users',
    value: analytics.totalActiveUsers.toLocaleString('en-US'),
    Icon: FaUserCheck,
    iconClassName:
      'text-fuchsia-500 bg-fuchsia-200 dark:bg-fuchsia-500/20 dark:text-fuchsia-400',
  },
  {
    label: 'Total Active Subscribers',
    value: analytics.totalSubscribers.toLocaleString('en-US'),
    Icon: FaCrown,
    iconClassName:
      'text-emerald-500 bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  {
    label: 'Available Balance',
    value: formatBalance(analytics.availableBalance),
    Icon: FaMoneyBillTrendUp,
    iconClassName: 'text-muted-foreground bg-muted',
  },
];

const AnalyticsCards = ({
  analytics,
}: {
  analytics: AdminDashboardAnalytics;
}) => (
  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 '>
    {getCards(analytics).map(({ label, value, Icon, iconClassName }) => (
      <Card key={label}>
        <CardContent className='flex items-center gap-4'>
          <div
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-lg',
              iconClassName,
            )}
          >
            <Icon className='size-6' />
          </div>
          <div className='flex min-w-0 flex-col'>
            <span className='text-muted-foreground truncate text-sm'>
              {label}
            </span>
            <span className='truncate text-2xl font-semibold'>{value}</span>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default AnalyticsCards;
