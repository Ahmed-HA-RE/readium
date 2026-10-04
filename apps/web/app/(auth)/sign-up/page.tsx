import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import AuthHeader from '../_components/auth-header';
import OAuthProviders from '../_components/oauth-providers';
import SignUpForm from './_components/sign-up-form';
import { toAbsoluteUrl, toSafeCallbackUrl } from '@/lib/absolute-url';

export const metadata: Metadata = {
  title: 'Create an account',
  description:
    'Create a free account to publish your writing, follow other writers and save what you want to read later.',
};

const SignUpPage = async ({
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
      <AuthHeader linkTo='sign-in' callbackUrl={callbackUrl} />

      <div className='flex flex-1 items-center justify-center py-12'>
        <div className='flex w-full max-w-lg flex-col gap-8 rounded-2xl py-8 px-6'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-2xl lg:text-4xl font-medium tracking-tight capitalize'>
              Create your account
            </h1>
            <p className='text-sm lg:text-base text-muted-foreground'>
              Enter your details to get started
            </p>
          </div>

          <OAuthProviders callbackUrl={toAbsoluteUrl(callbackUrl)} />
          <SignUpForm verifyRedirectUrl={toAbsoluteUrl('/login')} />
        </div>
      </div>
    </>
  );
};

export default SignUpPage;
