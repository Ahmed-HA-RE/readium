import type { LinkedAccount } from '@repo/types';
import PasswordSection from './password-section';
import LinkedAccountsSection from './linked-accounts-section';
import SessionsSection from './sessions-section';
import TwoFactorSection from './two-factor-section';
import DangerZoneSection from './danger-zone-section';

type SecuritySettingsProps = {
  email: string;
  accounts: LinkedAccount[];
  currentSessionId: string;
  isTwoFactorEnabled: boolean;
  isAdmin?: boolean;
};

const SecuritySettings = ({
  email,
  accounts,
  currentSessionId,
  isTwoFactorEnabled,
  isAdmin = false,
}: SecuritySettingsProps) => {
  const hasPassword = accounts.some(
    ({ providerId }) => providerId === 'credential',
  );

  return (
  <div className='flex flex-col divide-y pt-2 *:py-10 *:last:pb-0'>
    <PasswordSection hasPassword={hasPassword} email={email} />
    <LinkedAccountsSection accounts={accounts} />
    <SessionsSection currentSessionId={currentSessionId} />
    <TwoFactorSection isEnabled={isTwoFactorEnabled} hasPassword={hasPassword} />
    {/* Wrapped so the row padding doesn't clash with the danger zone's own box. */}
    <div>
      <DangerZoneSection email={email} isAdmin={isAdmin} />
    </div>
  </div>
  );
};

export default SecuritySettings;
