import SecuritySection from './security-section';
import DeleteAccountDialog from './delete-account-dialog';

const DangerZoneSection = ({ email }: { email: string }) => (
  <SecuritySection
    title='Danger zone'
    description='Permanently delete your account and everything you have published. We will email you to confirm first, and it cannot be undone.'
    action={<DeleteAccountDialog email={email} />}
    className='rounded-xl border border-destructive/40 p-5'
  />
);

export default DangerZoneSection;
