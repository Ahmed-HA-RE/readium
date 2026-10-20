import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa6';
import { IoShieldCheckmark } from 'react-icons/io5';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';
import { getLoginPath, getMySettingsPath, LOGIN_PATH } from '@/lib/routes';

// Resetting signs the user out everywhere, so setup sends them back to the Security tab after signing in.
const SECURITY_TAB_LOGIN = getLoginPath(getMySettingsPath('security'));

const ResetPasswordConfirmation = ({ isSetup }: { isSetup: boolean }) => {
  return (
    <div className='flex flex-col items-center gap-6 text-center'>
      <IoShieldCheckmark className='size-25 text-emerald-600' />

      <h1 className='text-2xl md:text-3xl xl:text-4xl font-medium tracking-tight capitalize mt-5 mb-0.5'>
        {isSetup ? 'Password Created' : 'Password Reset'} <br />
        <span className='text-emerald-600'>Successful</span>
      </h1>

      {isSetup && (
        <p className='text-sm xl:text-base text-muted-foreground -mt-2'>
          For your security you were signed out on every device. Sign in with
          your email and new password to continue.
        </p>
      )}

      <Link
        href={isSetup ? SECURITY_TAB_LOGIN : LOGIN_PATH}
        className={cn(
          buttonVariants({ size: 'lg', variant: 'outline' }),
          'group h-10 w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-600',
        )}
      >
        <FaArrowLeft className='transition-transform duration-200 group-hover:-translate-x-0.5' />
        {isSetup ? 'Sign in again' : 'Back to login'}
      </Link>
    </div>
  );
};

export default ResetPasswordConfirmation;
