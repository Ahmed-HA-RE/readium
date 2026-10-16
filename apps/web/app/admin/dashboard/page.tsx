import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GoDotFill } from 'react-icons/go';
import { IoMdCheckmark } from 'react-icons/io';
import { APP_NAME } from '@repo/constants';
import { ReportStatus } from '@repo/types';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { getDashboardAnalytics } from '@/lib/actions/admin/getDashboardAnalytics';
import AnalyticsCards from './_components/analytics-cards';
import BlogsTable from './_components/blogs-table';
import UsersTable from './_components/users-table';
import ReportsTable from './_components/reports-table';
import OverviewTableCard from './_components/overview-table-card';
import {
  ADMIN_BLOGS_PATH,
  ADMIN_REPORTS_PATH,
  ADMIN_USERS_PATH,
} from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: `Platform analytics and moderation for ${APP_NAME} admins.`,
};

const AdminOverviewPage = async () => {
  // The session call is deduped with the layout's by `cache`; the redirect only narrows the type for the greeting.
  const [session, analytics] = await Promise.all([
    getCurrentLoggedInUser(),
    getDashboardAnalytics(),
  ]);
  if (!session) redirect('/');

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <h1 className='text-3xl font-semibold tracking-tight wrap-anywhere lg:text-4xl'>
          Welcome back, {session.user.name}
        </h1>
        {analytics.pendingReports > 0 ? (
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
              {analytics.pendingReports.toLocaleString('en-US')}
            </Badge>
          </Link>
        ) : (
          <Badge variant='success' size='lg'>
            <IoMdCheckmark />
            All caught up
          </Badge>
        )}
      </div>

      <AnalyticsCards analytics={analytics} />

      <div className='grid gap-10 xl:grid-cols-2 xl:gap-6'>
        <OverviewTableCard
          title='Latest Blogs'
          viewAllHref={ADMIN_BLOGS_PATH}
          viewAllLabel='View all blogs'
        >
          <BlogsTable />
        </OverviewTableCard>

        <OverviewTableCard
          title='Latest Users'
          viewAllHref={ADMIN_USERS_PATH}
          viewAllLabel='View all users'
        >
          <UsersTable />
        </OverviewTableCard>
      </div>

      <OverviewTableCard
        title='Pending Reports'
        viewAllHref={ADMIN_REPORTS_PATH}
        viewAllLabel='View all reports'
      >
        <ReportsTable />
      </OverviewTableCard>
    </div>
  );
};

export default AdminOverviewPage;
