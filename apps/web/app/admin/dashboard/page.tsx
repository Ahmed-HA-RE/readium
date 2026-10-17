import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { APP_NAME } from '@repo/constants';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { getDashboardAnalytics } from '@/lib/actions/admin/getDashboardAnalytics';
import AnalyticsCards from './_components/analytics-cards';
import PendingReportsAction from './_components/pending-reports-action';
import {
  AnalyticsCardsSkeleton,
  PendingReportsSkeleton,
} from './_components/analytics-skeletons';
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
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');

  // Started, not awaited: the badge and the cards await it in their own boundaries, so the tables don't wait on Stripe.
  const analyticsPromise = getDashboardAnalytics();

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <h1 className='text-3xl font-semibold tracking-tight wrap-anywhere lg:text-4xl'>
          Welcome back, {session.user.name}
        </h1>
        <Suspense fallback={<PendingReportsSkeleton />}>
          <PendingReportsAction analyticsPromise={analyticsPromise} />
        </Suspense>
      </div>

      <Suspense fallback={<AnalyticsCardsSkeleton />}>
        <AnalyticsCards analyticsPromise={analyticsPromise} />
      </Suspense>

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
