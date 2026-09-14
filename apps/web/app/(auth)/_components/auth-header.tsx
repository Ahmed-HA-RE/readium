import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa6';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import Image from 'next/image';
import { APP_LOGO } from '@repo/assets';

interface AuthHeaderProps {
  // Omitted on the password-reset routes, which have no counterpart route to offer.
  mode?: 'login' | 'sign-up';
  callbackUrl?: string;
}

const logoStyle = { width: 40, height: 'auto' };

const AuthHeader = ({ mode, callbackUrl = '/' }: AuthHeaderProps) => {
  const isLogin = mode === 'login';
  const target = isLogin ? '/sign-up' : '/login';
  const href =
    callbackUrl === '/'
      ? target
      : `${target}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <header className='flex items-center justify-between gap-4'>
      <Link href='/'>
        <Image
          src={APP_LOGO}
          alt='App Logo'
          width={0}
          height={0}
          sizes='100vw'
          style={logoStyle}
        />
      </Link>
      {mode && (
        <Link
          className={cn(
            buttonVariants({ size: 'lg', variant: 'ghost' }),
            'group',
          )}
          href={href}
        >
          {isLogin ? 'Create an account' : 'Sign in'}
          <FaArrowRight className='transition-transform duration-200 group-hover:translate-x-0.5' />
        </Link>
      )}
    </header>
  );
};

export default AuthHeader;
