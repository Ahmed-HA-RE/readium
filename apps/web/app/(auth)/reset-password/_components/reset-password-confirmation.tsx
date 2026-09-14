import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa6';
import { IoShieldCheckmark } from 'react-icons/io5';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';

const ResetPasswordConfirmation = () => {
  return (
    <div className='flex flex-col items-center gap-6 text-center'>
      <IoShieldCheckmark className='size-25 text-emerald-600' />

      <h1 className='text-2xl md:text-3xl xl:text-4xl font-medium tracking-tight capitalize mt-5 mb-0.5'>
        Password Reset <br />
        <span className='text-emerald-600'>Successful</span>
      </h1>

      <Link
        href='/login'
        className={cn(
          buttonVariants({ size: 'lg', variant: 'outline' }),
          'group h-10 w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-600',
        )}
      >
        <FaArrowLeft className='transition-transform duration-200 group-hover:-translate-x-0.5' />
        Back to login
      </Link>
    </div>
  );
};

export default ResetPasswordConfirmation;
