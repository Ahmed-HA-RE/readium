import type { CurrentUser } from '@repo/types';
import type { SettingsTab } from '@/lib/search-params';
import SettingsProfile from './settings-profile';
import SettingsTabs from './settings-tabs';

type SettingsViewProps = {
  user: Pick<CurrentUser, 'name' | 'email' | 'image' | 'bio' | 'isPro'>;
  panels: Record<SettingsTab, React.ReactNode>;
};

const SettingsView = ({ user, panels }: SettingsViewProps) => (
  <div className='mx-auto flex w-full max-w-6xl flex-col px-4 pt-10 pb-6 sm:px-6 lg:min-h-[calc(100svh-61px)] lg:px-8 lg:pt-12 lg:pb-0'>
    <div className='grid gap-y-6 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr] lg:gap-x-12'>
      <h1 className='mb-6 text-4xl font-bold tracking-tight lg:col-start-1 lg:mb-0 lg:text-5xl'>
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
