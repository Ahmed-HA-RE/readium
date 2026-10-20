'use client';

import { usePathname } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import {
  MdCreditCard,
  MdManageAccounts,
  MdNotifications,
  MdSecurity,
} from 'react-icons/md';
import { ADMIN_OVERVIEW_PATH } from '@/lib/routes';
import { settingsParsers, type SettingsTab } from '@/lib/search-params';
import DashboardTabs, {
  type DashboardTab,
} from '@/components/shared/dashboard-tabs';

const TABS: DashboardTab[] = [
  { value: 'account', label: 'Account', icon: MdManageAccounts },
  { value: 'security', label: 'Security', icon: MdSecurity },
  { value: 'membership', label: 'Payment and Membership', icon: MdCreditCard },
  { value: 'notifications', label: 'Notifications', icon: MdNotifications },
];

// Admins have every feature already, so their settings have no membership panel.
export type SettingsPanels = Record<
  Exclude<SettingsTab, 'membership'>,
  React.ReactNode
> & { membership?: React.ReactNode };

// Every panel arrives rendered, so switching is client-only and never shows the previous tab.
const SettingsTabs = ({ panels }: { panels: SettingsPanels }) => {
  const [{ tab }, setParams] = useQueryStates(settingsParsers);
  const isAdmin = usePathname().startsWith(ADMIN_OVERVIEW_PATH);

  const tabs = isAdmin
    ? TABS.filter(({ value }) => value !== 'membership')
    : TABS;
  // A hand-typed `?tab=membership` on the admin route falls back to the first tab.
  const activeTab = tabs.some(({ value }) => value === tab) ? tab : 'account';

  return (
    <DashboardTabs
      tabs={tabs}
      value={activeTab}
      onValueChange={(next) => setParams({ tab: next as SettingsTab })}
    >
      {panels[activeTab]}
    </DashboardTabs>
  );
};

export default SettingsTabs;
