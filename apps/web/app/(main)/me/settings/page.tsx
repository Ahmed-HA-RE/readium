import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ADMIN_SETTINGS_PATH } from '@/lib/utils';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { getMyAccounts } from '@/lib/actions/user/getMyAccounts';
import SettingsView from '@/components/shared/settings/settings-view';
import AccountSettings from '@/components/shared/settings/account/account-settings';
import SecuritySettings from '@/components/shared/settings/security/security-settings';

// Title only: the page is signed-in only and `robots.ts` disallows `/me/`.
export const metadata: Metadata = { title: 'Settings' };

// Both tabs render up front; `SettingsTabs` reads `?tab=` on the client and switches between them.
const SettingsPage = async () => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');
  if (session.user.role === 'admin') redirect(ADMIN_SETTINGS_PATH);

  const { user } = session;
  const accounts = await getMyAccounts();

  return (
    <SettingsView
      user={user}
      panels={{
        account: <AccountSettings user={user} />,
        security: (
          <SecuritySettings
            email={user.email}
            accounts={accounts}
            currentSessionId={session.session.id}
          />
        ),
      }}
    />
  );
};

export default SettingsPage;
