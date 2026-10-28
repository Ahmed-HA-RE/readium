'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PLANS_PATH } from '@/lib/routes';
import { WELCOME_OFFER_DISCOUNT } from '@/lib/plans';

// Client-only: the layout renders it for eligible members, but only the homepage shows it.
const WelcomeOfferBanner = () => {
  const pathname = usePathname();
  if (pathname !== '/') return null;

  return (
    <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-app px-4 py-2 text-sm text-white'>
      <span className='rounded-md bg-black px-2.5 py-1 font-medium max-md:hidden'>
        Welcome offer
      </span>
      <p className='max-md:text-center'>
        Access to everything. Now {Math.round(WELCOME_OFFER_DISCOUNT * 100)}%
        off your first year.{' '}
        <Link
          href={PLANS_PATH}
          className='font-medium underline underline-offset-4'
        >
          Upgrade now
        </Link>
      </p>
    </div>
  );
};

export default WelcomeOfferBanner;
