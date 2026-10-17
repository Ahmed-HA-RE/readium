import Link from 'next/link';
import { GoDotFill } from 'react-icons/go';
import { IoMdCheckmark } from 'react-icons/io';
import { ReportStatus, type AdminDashboardAnalytics } from '@repo/types';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { ADMIN_REPORTS_PATH } from '@/lib/utils';

// Awaits the page's analytics request, so it streams in on its own without a second call.
const PendingReportsAction = async ({
  analyticsPromise,
}: {
  analyticsPromise: Promise<AdminDashboardAnalytics>;
}) => {
  const { pendingReports } = await analyticsPromise;

  return pendingReports > 0 ? (
    <Link
      href={`${ADMIN_REPORTS_PATH}?status=${ReportStatus.PENDING}`}
      className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }))}
    >
      <GoDotFill
        aria-hidden
        className='text-destructive motion-safe:animate-pulse'
      />
      Review reports
      <Badge variant='destructive' className='tabular-nums'>
        {pendingReports.toLocaleString('en-US')}
      </Badge>
    </Link>
  ) : (
    <Badge variant='success' size='lg'>
      <IoMdCheckmark />
      All caught up
    </Badge>
  );
};

export default PendingReportsAction;
