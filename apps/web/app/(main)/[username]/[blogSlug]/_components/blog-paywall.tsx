import Link from 'next/link';
import { FaLock } from 'react-icons/fa6';
import { SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type BlogPaywallProps = {
  isSignedIn: boolean;
};

// Signed-out readers sign in first, and the login page sends them on to the plans.
const UPGRADE_SIGNED_OUT_PATH = `/login?callbackUrl=${encodeURIComponent('/plans')}`;

// Covers the end of a pro story's first half, which is all the API sends.
const BlogPaywall = ({ isSignedIn }: BlogPaywallProps) => (
  <div className='absolute inset-x-0 bottom-0 flex h-full max-h-112 flex-col items-center justify-end px-4 pb-6'>
    <div
      aria-hidden
      className='absolute inset-0 bg-background/60 mask-[linear-gradient(to_bottom,transparent,black_40%)] backdrop-blur-lg'
    />

    <div className='relative flex max-w-md flex-col items-center gap-4 text-center'>
      <FaLock aria-hidden className='size-12' />
      <div className='flex flex-col gap-1'>
        <h2 className='text-xl font-semibold tracking-tight'>
          This story is for Pro members
        </h2>
        <p className='text-sm text-muted-foreground'>
          Upgrade to Pro to keep reading it, along with every other Pro story
          on {SITE_NAME}.
        </p>
      </div>
      <Link
        href={isSignedIn ? '/plans' : UPGRADE_SIGNED_OUT_PATH}
        className={cn(buttonVariants({ size: 'lg' }), 'rounded-full')}
      >
        Upgrade now
      </Link>
    </div>
  </div>
);

export default BlogPaywall;
