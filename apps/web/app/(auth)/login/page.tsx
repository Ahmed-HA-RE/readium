import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import AuthHeader from '../_components/auth-header';
import OAuthProviders from '../_components/oauth-providers';
import LoginForm from './_components/login-form';
import { toAbsoluteUrl, toSafeCallbackUrl } from '@/lib/absolute-url';
import { ADMIN_OVERVIEW_PATH } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to pick up where you left off — your drafts, bookmarks and the writers you follow.',
};

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) => {
  const { callbackUrl: rawCallbackUrl = '/' } = await searchParams;
  const callbackUrl = toSafeCallbackUrl(rawCallbackUrl);

  // Also where a successful sign-in lands, via the client's redirect to `verifyRedirectUrl` below.
  const session = await getCurrentLoggedInUser();
  if (session) {
    redirect(session.user.role === 'admin' ? ADMIN_OVERVIEW_PATH : callbackUrl);
  }

  return (
    <>
      <AuthHeader linkTo='sign-up' callbackUrl={callbackUrl} />

      <div className='flex flex-1 items-center justify-center py-12'>
        <div className='flex w-full max-w-lg flex-col gap-8 rounded-2xl py-8 px-6 lg:rounded-none'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-2xl lg:text-4xl font-medium tracking-tight capitalize'>
              Welcome back
            </h1>
            <p className='text-sm md:text-base text-muted-foreground'>
              Sign in to keep reading and start writing
            </p>
          </div>

          <OAuthProviders
            callbackUrl={toAbsoluteUrl(callbackUrl)}
            showLastUsed
          />
          <LoginForm
            verifyRedirectUrl={toAbsoluteUrl(
              `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
            )}
          />
        </div>
      </div>
    </>
  );
};

export default LoginPage;
