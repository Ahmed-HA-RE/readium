import Link from 'next/link';
import { GoBell } from 'react-icons/go';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';
import { NOTIFICATIONS_PATH } from '@/lib/routes';

const NotificationsBell = ({ className }: { className?: string }) => (
  <Link
    href={NOTIFICATIONS_PATH}
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
