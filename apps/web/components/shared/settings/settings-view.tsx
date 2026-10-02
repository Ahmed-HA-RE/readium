import type { CurrentUser } from '@repo/types';
import type { SettingsTab } from '@/lib/search-params';
import SettingsProfile from './settings-profile';
import SettingsTabs from './settings-tabs';

type SettingsViewProps = {
  user: Pick<CurrentUser, 'name' | 'email' | 'image' | 'bio' | 'isPro'>;
  panels: Record<SettingsTab, React.ReactNode>;
};

// The whole settings layout, so `/me/settings` and the admin dashboard mount the same page.
const SettingsView = ({ user, panels }: SettingsViewProps) => (
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
        <SettingsTabs panels={panels} />
      </div>
    </div>
  </div>
);

export default SettingsView;
