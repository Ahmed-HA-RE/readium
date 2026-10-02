import SecuritySection from './security-section';
import ChangePasswordForm from './change-password-form';
import SetUpPasswordAlert from './set-up-password-alert';

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
    <div>
      <SetUpPasswordAlert email={email} />
    </div>
  );

export default PasswordSection;
