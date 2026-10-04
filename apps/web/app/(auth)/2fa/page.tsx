import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { toSafeCallbackUrl } from '@/lib/absolute-url';
import AuthHeader from '../_components/auth-header';
import TwoFactorTabs from './_components/two-factor-tabs';

export const metadata: Metadata = {
  title: 'Two-factor authentication',
  description: 'Confirm it is you with a code to finish signing in.',
};

// Reached from the login form via `onTwoFactorRedirect`, which keeps the login page's `?callbackUrl=`.
const TwoFactorPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) => {
  const { callbackUrl: rawCallbackUrl = '/' } = await searchParams;
  const callbackUrl = toSafeCallbackUrl(rawCallbackUrl);

  const session = await getCurrentLoggedInUser();
  if (session) redirect(callbackUrl);

  return (
    <>
      <AuthHeader linkTo='sign-in' callbackUrl={callbackUrl} />

      <div className='flex flex-1 items-center justify-center py-12'>
        <div className='flex w-full max-w-lg flex-col gap-8 rounded-2xl py-8 lg:rounded-none'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-2xl font-medium tracking-tight lg:text-4xl'>
              Two-factor authentication
            </h1>
            <p className='text-sm text-muted-foreground md:text-base'>
              Confirm it&apos;s you to finish signing in
            </p>
          </div>

          <TwoFactorTabs callbackUrl={callbackUrl} />
        </div>
      </div>
    </>
  );
};

export default TwoFactorPage;
