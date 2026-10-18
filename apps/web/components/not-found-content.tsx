import Link from 'next/link';
import { cn } from 'cn';
import BrokenLinkCanvas from '@/components/broken-link-canvas';

// The 404's canvas and copy, shared by the bare root page and the one inside the site layout.
const NotFoundContent = ({ className }: { className?: string }) => (
  <div className={cn('flex flex-col items-center px-4 text-center', className)}>
    <BrokenLinkCanvas className='w-full max-w-md' />

    <div className='flex flex-col items-center gap-2.5'>
      <p className='text-muted-foreground text-lg tabular-nums'>404</p>
      <h1 className='text-4xl font-semibold tracking-tight sm:text-5xl'>
        This story doesn’t exist.
      </h1>
      <p className='text-muted-foreground'>
        The link’s broken, or the story has moved on.
      </p>
      <Link
        href='/'
        className='decoration-muted-foreground/50 hover:decoration-foreground mt-3 text-sm font-medium underline underline-offset-4 transition'
      >
        Back home
      </Link>
    </div>
  </div>
);

export default NotFoundContent;
