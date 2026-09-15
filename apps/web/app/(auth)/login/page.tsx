import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import AuthHeader from '../_components/auth-header';
import OAuthProviders from '../_components/oauth-providers';
import LoginForm from './_components/login-form';
import { toAbsoluteUrl, toSafeCallbackUrl } from '@/lib/absolute-url';

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
  const session = await getCurrentLoggedInUser();
  if (session) redirect('/');

  const { callbackUrl: rawCallbackUrl = '/' } = await searchParams;
  const callbackUrl = toSafeCallbackUrl(rawCallbackUrl);

  return (
    <>
      <AuthHeader mode='login' callbackUrl={callbackUrl} />

      <div className='flex flex-1 items-center justify-center py-12'>
        <div className='flex w-full max-w-md flex-col gap-8 rounded-2xl py-8 px-6 lg:rounded-none'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-2xl lg:text-4xl font-medium tracking-tight capitalize'>
              Welcome back
            </h1>
            <p className='text-sm md:text-base text-muted-foreground'>
              Sign in to keep reading and start writing
            </p>
          </div>

          <OAuthProviders callbackUrl={toAbsoluteUrl(callbackUrl)} showLastUsed />
          <LoginForm
            callbackUrl={callbackUrl}
            verifyRedirectUrl={toAbsoluteUrl('/login')}
          />
        </div>
      </div>
    </>
  );
};

export default LoginPage;
