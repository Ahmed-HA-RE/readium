import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthHeader from '../_components/auth-header';
import ResetPasswordForm from './_components/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new password for your Readium account.',
};

// Better Auth's `/reset-password/:token` callback sends the user here with either
// `?token=` or `?error=INVALID_TOKEN` — there is nothing to reset without the former.
const ResetPasswordPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) => {
  const { token, error } = await searchParams;
  if (error || !token) redirect('/login');

  return (
    <>
      <AuthHeader />

      <div className='flex flex-1 items-center justify-center py-12'>
        <div className='flex w-full max-w-md flex-col gap-8 rounded-2xl py-8 px-6 lg:rounded-none lg:p-0'>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
