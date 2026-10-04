import SecuritySection from './security-section';
import ChangePasswordForm from './change-password-form';
import SetUpPasswordAlert from './set-up-password-alert';

export const SET_UP_PASSWORD_ANCHOR = 'set-up-password';

type PasswordSectionProps = {
  hasPassword: boolean;
  email: string;
};

const PasswordSection = ({ hasPassword, email }: PasswordSectionProps) =>
  hasPassword ? (
    <SecuritySection
      title='Password'
      description='Change the password you use to sign in with your email. Updating it signs you out on every other device.'
    >
      <ChangePasswordForm email={email} />
    </SecuritySection>
  ) : (
    // Wrapped so the tab's row padding sits around the alert, not inside its border.
    // `id` is the target of the 2FA section's "Set up a password" link.
    <div id={SET_UP_PASSWORD_ANCHOR} className='scroll-mt-24'>
      <SetUpPasswordAlert email={email} />
    </div>
  );

export default PasswordSection;
