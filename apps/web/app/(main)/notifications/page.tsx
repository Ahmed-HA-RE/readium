import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ADMIN_NOTIFICATIONS_PATH } from '@/lib/routes';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import NotificationsActions from '@/components/shared/notifications/notifications-actions';
import NotificationsListSkeleton from '@/components/shared/notifications/notifications-list-skeleton';
import NotificationsSection from '@/components/shared/notifications/notifications-section';

// Signed-in only, and `robots.ts` disallows `/notifications`.
export const metadata: Metadata = {
  title: 'Notifications',
  description: 'Likes and responses on your stories.',
};

const NotificationsPage = async () => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');
  if (session.user.role === 'admin') redirect(ADMIN_NOTIFICATIONS_PATH);

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='flex flex-col gap-1.5'>
          <h1 className='text-3xl font-bold tracking-tight'>Notifications</h1>
          <p className='text-muted-foreground text-sm'>
            Likes and responses on your stories.
          </p>
        </div>
        <NotificationsActions />
      </div>

      <Suspense fallback={<NotificationsListSkeleton />}>
        <NotificationsSection username={session.user.name} isAdmin={false} />
      </Suspense>
    </div>
  );
};

export default NotificationsPage;
