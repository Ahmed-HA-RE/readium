'use client';

import { useQueryStates } from 'nuqs';
import { MdManageAccounts } from 'react-icons/md';
import { settingsParsers, type SettingsTab } from '@/lib/search-params';
import DashboardTabs, {
  type DashboardTab,
} from '@/components/shared/dashboard-tabs';

const TABS: DashboardTab[] = [
  { value: 'account', label: 'Account', icon: MdManageAccounts },
];

const SettingsTabs = ({ children }: { children: React.ReactNode }) => {
  const [{ tab }, setParams] = useQueryStates(settingsParsers, {
    shallow: false,
  });

  return (
    <DashboardTabs
      tabs={TABS}
      value={tab}
      onValueChange={(next) => setParams({ tab: next as SettingsTab })}
    >
      {children}
    </DashboardTabs>
  );
};

export default SettingsTabs;
