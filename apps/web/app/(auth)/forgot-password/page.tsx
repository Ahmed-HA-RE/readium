import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { toAbsoluteUrl } from '@/lib/absolute-url';
import AuthHeader from '../_components/auth-header';
import ForgotPasswordForm from './_components/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password',
  description:
    'Enter your email address and we will send you a link to set a new password.',
};

const ForgotPasswordPage = async () => {
  const session = await getCurrentLoggedInUser();
  if (session) redirect('/');

  return (
    <>
      <AuthHeader />

      <div className='flex flex-1 items-center justify-center py-12'>
        <div className='flex w-full max-w-md flex-col gap-8 rounded-2xl py-8 px-6 lg:rounded-none lg:p-0'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-2xl md:text-3xl xl:text-4xl font-medium tracking-tight capitalize'>
              Forgot Password
            </h1>
            <p className='text-sm xl:text-base text-muted-foreground'>
              Enter your email and we&apos;ll send you a link to set a new one
            </p>
          </div>

          <ForgotPasswordForm
            resetPasswordUrl={toAbsoluteUrl('/reset-password')}
          />
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
