import type { Metadata } from 'next';
import { APP_NAME } from '@repo/constants';
import UsersTable from '../_components/users-table';

export const metadata: Metadata = {
  title: 'Manage Users',
  description: `Manage the users on ${APP_NAME}: search by name or email, filter by status, review their activity, and ban them or revoke their sessions.`,
};

const AdminUsersPage = () => (
  <div className='flex flex-col gap-8'>
    <div className='flex flex-col gap-2'>
      <h1 className='text-3xl font-semibold tracking-tight lg:text-4xl'>
        Users
      </h1>
      <p className='text-muted-foreground'>
        Search, filter and moderate every account on the platform.
      </p>
    </div>

    <div className='min-w-0 rounded-xl border'>
      <UsersTable showControls />
    </div>
  </div>
);

export default AdminUsersPage;
