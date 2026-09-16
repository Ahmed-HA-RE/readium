import Link from 'next/link';
import { GoBell } from 'react-icons/go';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';

const NotificationsBell = ({ className }: { className?: string }) => (
  <Link
    href='/notifications'
    className={cn(
      buttonVariants({ variant: 'ghost-plain', size: 'icon-lg' }),
      'text-muted-foreground',
      className,
    )}
  >
    <GoBell className='size-5' />
    <span className='sr-only'>Notifications</span>
  </Link>
);

export default NotificationsBell;
