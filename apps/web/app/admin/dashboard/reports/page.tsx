import type { Metadata } from 'next';
import { APP_NAME } from '@repo/constants';
import ReportsTable from '../_components/reports-table';

export const metadata: Metadata = {
  title: 'Manage Reports',
  description: `Manage the reports on ${APP_NAME}: search by reporter, filter by reason or status, and review pending reports against the reported stories.`,
};

const AdminReportsPage = () => (
  <div className='flex flex-col gap-8'>
    <div className='flex flex-col gap-2'>
      <h1 className='text-3xl font-semibold tracking-tight lg:text-4xl'>
        Reports
      </h1>
      <p className='text-muted-foreground'>
        Review what readers flagged and decide on every report.
      </p>
    </div>

    <div className='min-w-0 rounded-xl border'>
      <ReportsTable showControls />
    </div>
  </div>
);

export default AdminReportsPage;
