import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft } from 'react-icons/fa';
import { APP_LOGO } from '@repo/assets';
import { APP_NAME } from '@repo/constants';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';

const logoStyle = { width: 36, height: 'auto' };

const PlansHeader = () => {
  return (
    // Equal side columns keep the logo centered whatever the back link's width.
    <header className='grid h-15 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-4 sm:px-6 lg:px-8'>
      <Link
        href='/'
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'group justify-self-start',
        )}
      >
        <FaArrowLeft className='transition-transform duration-200 group-hover:-translate-x-0.5' />
        Back to Home
      </Link>

      <Link href='/' className='shrink-0'>
        <Image
          src={APP_LOGO}
          alt={APP_NAME}
          width={0}
          height={0}
          sizes='100vw'
          priority
          style={logoStyle}
        />
      </Link>
    </header>
  );
};

export default PlansHeader;
