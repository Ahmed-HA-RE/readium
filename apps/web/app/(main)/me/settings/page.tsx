import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { SearchParams } from 'nuqs/server';
import { ADMIN_SETTINGS_PATH } from '@/lib/utils';
import { loadSettingsSearchParams } from '@/lib/search-params';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import SettingsProfile from './_components/settings-profile';
import SettingsTabs from './_components/settings-tabs';
import AccountSettings from './_components/account-settings';

// Title only: the page is signed-in only and `robots.ts` disallows `/me/`.
export const metadata: Metadata = { title: 'Settings' };

const SettingsPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');
  if (session.user.role === 'admin') redirect(ADMIN_SETTINGS_PATH);

  const { tab } = await loadSettingsSearchParams(searchParams);
  const { user } = session;

  return (
    <div className='mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className='grid gap-y-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-12'>
        <h1 className='text-3xl font-bold tracking-tight lg:col-start-1'>
          Settings
        </h1>

        <SettingsProfile
          user={user}
          className='lg:col-start-2 lg:row-span-2 lg:row-start-1'
        />

        <div className='min-w-0 lg:col-start-1'>
          <SettingsTabs>
            {tab === 'account' && <AccountSettings user={user} />}
          </SettingsTabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
