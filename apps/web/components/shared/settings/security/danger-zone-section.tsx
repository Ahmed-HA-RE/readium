import SecuritySection from './security-section';
import DeleteAccountDialog from './delete-account-dialog';

type DangerZoneSectionProps = {
  email: string;
  isAdmin: boolean;
};

const DangerZoneSection = ({ email, isAdmin }: DangerZoneSectionProps) => (
  <SecuritySection
    title='Danger zone'
    description={
      isAdmin
        ? 'Permanently delete your admin account and your access to the dashboard. Your moderation decisions stay in place. We will email you to confirm first, and it cannot be undone.'
        : 'Permanently delete your account and everything you have published. We will email you to confirm first, and it cannot be undone.'
    }
    action={<DeleteAccountDialog email={email} isAdmin={isAdmin} />}
    className='rounded-xl border border-destructive/40 p-5'
  />
);

export default DangerZoneSection;
