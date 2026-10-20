import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa6';
import { buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import Image from 'next/image';
import { APP_LOGO } from '@repo/assets';
import { LOGIN_PATH, SIGN_UP_PATH } from '@/lib/routes';

const LINKS = {
  'sign-in': { href: LOGIN_PATH, label: 'Sign in' },
  'sign-up': { href: SIGN_UP_PATH, label: 'Create an account' },
} as const;

interface AuthHeaderProps {

  linkTo?: keyof typeof LINKS;
  callbackUrl?: string;
}

const logoStyle = { width: 40, height: 'auto' };

const AuthHeader = ({ linkTo, callbackUrl = '/' }: AuthHeaderProps) => {
  const link = linkTo && LINKS[linkTo];

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
      {link && (
        <Link
          className={cn(
            buttonVariants({ size: 'lg', variant: 'ghost' }),
            'group',
          )}
          href={
            callbackUrl === '/'
              ? link.href
              : `${link.href}?callbackUrl=${encodeURIComponent(callbackUrl)}`
          }
        >
          {link.label}
          <FaArrowRight className='transition-transform duration-200 group-hover:translate-x-0.5' />
        </Link>
      )}
    </header>
  );
};

export default AuthHeader;
