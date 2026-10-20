import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { getMyAccounts } from '@/lib/actions/user/getMyAccounts';
import SettingsView from '@/components/shared/settings/settings-view';
import AccountSettings from '@/components/shared/settings/account/account-settings';
import SecuritySettings from '@/components/shared/settings/security/security-settings';

export const metadata: Metadata = { title: 'Settings' };

const AdminSettingsPage = async () => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');

  const { user } = session;
  const accounts = await getMyAccounts();

  return (
    <SettingsView
      user={user}
      // The admin shell's `main` already pads the page and owns the scroll height.
      className='p-0 sm:p-0 lg:min-h-0 lg:p-0'
      panels={{
        account: <AccountSettings user={user} />,
        security: (
          <SecuritySettings
            email={user.email}
            accounts={accounts}
            currentSessionId={session.session.id}
            isTwoFactorEnabled={!!user.twoFactorEnabled}
            isAdmin
          />
        ),
        // Empty until the mute system decides what notification preferences exist.
        notifications: null,
      }}
    />
  );
};

export default AdminSettingsPage;
