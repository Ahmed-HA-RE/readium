import Image from 'next/image';

const AuthLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <div className='min-h-svh bg-muted lg:p-6'>
      <div className='grid min-h-svh lg:min-h-[calc(100svh-3rem)] lg:grid-cols-2 lg:gap-8'>
        <div className='flex flex-col bg-background p-6 sm:p-10 lg:rounded-3xl lg:shadow-sm'>
          {children}
        </div>

        <div className='hidden flex-col justify-center gap-8 px-4 lg:flex'>
          <div className='flex flex-col gap-4'>
            <h2 className='text-4xl font-bold tracking-tight text-balance xl:text-5xl'>
              Where good ideas find their readers.
            </h2>
            <p className='max-w-md text-lg text-pretty text-muted-foreground'>
              Publish what you know, follow the writers you trust, and keep the
              conversation going.
            </p>
          </div>
          <Image
            src='/authentication-image.svg'
            alt='Authentication illustration'
            width={960}
            height={729}
            priority
            className='h-auto w-full max-w-xl'
          />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
