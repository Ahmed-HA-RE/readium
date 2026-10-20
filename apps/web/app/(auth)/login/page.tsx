import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import AuthHeader from '../_components/auth-header';
import OAuthProviders from '../_components/oauth-providers';
import OAuthErrorAlert from '../_components/oauth-error-alert';
import LoginForm from './_components/login-form';
import { toAbsoluteUrl, toSafeCallbackUrl } from '@/lib/absolute-url';
import { ADMIN_OVERVIEW_PATH, getLoginPath } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to pick up where you left off — your drafts, bookmarks and the writers you follow.',
};

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) => {
  const { callbackUrl: rawCallbackUrl = '/', error } = await searchParams;
  const callbackUrl = toSafeCallbackUrl(rawCallbackUrl);
  // Also where a failed OAuth sign-in comes back to, with `&error=<code>` appended.
  const loginUrl = toAbsoluteUrl(getLoginPath(callbackUrl));

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

          <OAuthErrorAlert error={error} />
          <OAuthProviders
            callbackUrl={toAbsoluteUrl(callbackUrl)}
            errorCallbackUrl={loginUrl}
            showLastUsed
          />
          <LoginForm verifyRedirectUrl={loginUrl} />
        </div>
      </div>
    </>
  );
};

export default LoginPage;
