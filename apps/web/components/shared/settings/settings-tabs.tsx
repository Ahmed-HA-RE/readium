'use client';

import { useQueryStates } from 'nuqs';
import { MdManageAccounts, MdSecurity } from 'react-icons/md';
import { settingsParsers, type SettingsTab } from '@/lib/search-params';
import DashboardTabs, {
  type DashboardTab,
} from '@/components/shared/dashboard-tabs';

const TABS: DashboardTab[] = [
  { value: 'account', label: 'Account', icon: MdManageAccounts },
  { value: 'security', label: 'Security', icon: MdSecurity },
];

// Every panel arrives rendered, so switching is client-only and never shows the previous tab.
const SettingsTabs = ({
  panels,
}: {
  panels: Record<SettingsTab, React.ReactNode>;
}) => {
  const [{ tab }, setParams] = useQueryStates(settingsParsers);

  return (
    <DashboardTabs
      tabs={TABS}
      value={tab}
      onValueChange={(next) => setParams({ tab: next as SettingsTab })}
    >
      {panels[tab]}
    </DashboardTabs>
  );
};

export default SettingsTabs;
