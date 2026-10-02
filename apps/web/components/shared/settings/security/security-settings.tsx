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
};

const SecuritySettings = ({
  email,
  accounts,
  currentSessionId,
}: SecuritySettingsProps) => (
  <div className='flex flex-col divide-y pt-2 *:py-10 *:last:pb-0'>
    <PasswordSection
      hasPassword={accounts.some(
        ({ providerId }) => providerId === 'credential',
      )}
      email={email}
    />
    <LinkedAccountsSection accounts={accounts} />
    <SessionsSection currentSessionId={currentSessionId} />
    <TwoFactorSection />
    {/* Wrapped so the row padding doesn't clash with the danger zone's own box. */}
    <div>
      <DangerZoneSection email={email} />
    </div>
  </div>
);

export default SecuritySettings;
