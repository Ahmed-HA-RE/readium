import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RxArrowTopRight } from 'react-icons/rx';
import { Stripe } from '@thesvg/react';
import { APP_NAME } from '@repo/constants';
import { STRIPE_DASHBOARD_URL } from '@/lib/constants';
import PaymentCards from './_components/payment-cards';
import PaymentCardsSkeleton from './_components/payment-card-skeleton';

export const metadata: Metadata = {
  title: 'Manage Payments',
  description: `Manage payments on ${APP_NAME}: check the balance, subscribers and upcoming cancellations, and open the Stripe dashboard.`,
};

const STRIPE_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Payments', path: '/payments' },
  { label: 'Balances', path: '/balances' },
  { label: 'Subscriptions', path: '/subscriptions' },
  { label: 'Customers', path: '/customers' },
  { label: 'Settings', path: '/settings' },
  { label: 'Tax', path: '/settings/tax' },
];

const AdminPaymentsPage = () => (
  <div className='flex flex-col gap-10'>
    <div className='flex flex-col gap-2'>
      <h1 className='text-3xl font-semibold tracking-tight lg:text-4xl'>
        Payments
      </h1>
      <p className='text-muted-foreground flex flex-wrap items-center gap-1.5'>
        Payments, subscriptions and payouts run on
        <Stripe role='img' aria-label='Stripe' className='h-5 w-auto' />
      </p>
    </div>

    <Suspense fallback={<PaymentCardsSkeleton />}>
      <PaymentCards />
    </Suspense>

    <section className='flex flex-col gap-4'>
      <h2 className='text-2xl font-semibold tracking-tight'>
        Stripe dashboard
      </h2>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {STRIPE_LINKS.map(({ label, path }) => (
          <a
            key={path}
            href={`${STRIPE_DASHBOARD_URL}${path}`}
            target='_blank'
            rel='noopener noreferrer'
            className='hover:bg-muted flex items-center justify-between gap-3 rounded-xl border px-4 py-3 font-medium transition'
          >
            <span>
              {label}
              <span className='sr-only'> (opens in a new tab)</span>
            </span>
            <RxArrowTopRight
              aria-hidden
              className='text-muted-foreground size-4 shrink-0'
            />
          </a>
        ))}
      </div>
    </section>
  </div>
);

export default AdminPaymentsPage;
