import { Suspense } from 'react';
import type { Metadata } from 'next';
import { APP_NAME } from '@repo/constants';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import NotificationsActions from '@/components/shared/notifications/notifications-actions';
import NotificationsListSkeleton from '@/components/shared/notifications/notifications-list-skeleton';
import NotificationsSection from '@/components/shared/notifications/notifications-section';

export const metadata: Metadata = {
  title: 'Notifications',
  description: `Reports readers have filed on ${APP_NAME}.`,
};

// The dashboard layout has already redirected anyone who is not an admin.
const AdminNotificationsPage = async () => {
  const session = await getCurrentLoggedInUser();

  return (
    <div className='flex max-w-3xl flex-col gap-8'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl font-semibold tracking-tight lg:text-4xl'>
            Notifications
          </h1>
          <p className='text-muted-foreground'>Reports readers have filed.</p>
        </div>
        <NotificationsActions />
      </div>

      <Suspense fallback={<NotificationsListSkeleton />}>
        <NotificationsSection username={session?.user.name ?? ''} isAdmin />
      </Suspense>
    </div>
  );
};

export default AdminNotificationsPage;
