import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ADMIN_SETTINGS_PATH } from '@/lib/utils';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { getMyAccounts } from '@/lib/actions/user/getMyAccounts';
import { getActiveSubscription } from '@/lib/actions/subscription/getActiveSubscription';
import SettingsView from '@/components/shared/settings/settings-view';
import AccountSettings from '@/components/shared/settings/account/account-settings';
import SecuritySettings from '@/components/shared/settings/security/security-settings';
import MembershipSettings from '@/components/shared/settings/membership/membership-settings';

// Title only: the page is signed-in only and `robots.ts` disallows `/me/`.
export const metadata: Metadata = { title: 'Settings' };

// Every tab renders up front; `SettingsTabs` reads `?tab=` on the client and switches between them.
const SettingsPage = async () => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect('/');
  if (session.user.role === 'admin') redirect(ADMIN_SETTINGS_PATH);

  const { user } = session;
  // Only members have a subscription to show.
  const [accounts, subscription] = await Promise.all([
    getMyAccounts(),
    user.isPro ? getActiveSubscription() : null,
  ]);

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
            isTwoFactorEnabled={!!user.twoFactorEnabled}
          />
        ),
        membership: (
          <MembershipSettings isPro={user.isPro} subscription={subscription} />
        ),
      }}
    />
  );
};

export default SettingsPage;
