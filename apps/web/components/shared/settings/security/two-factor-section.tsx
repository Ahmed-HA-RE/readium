import { Badge } from '@/components/ui/badge';
import SecuritySection from './security-section';

// Placeholder until 2FA is built at the end of this phase.
const TwoFactorSection = () => (
  <SecuritySection
    title='Two-factor authentication'
    description='Ask for a one-time code from your authenticator app whenever you sign in with your password, so a leaked password alone is not enough to get into your account.'
    action={<Badge variant='secondary'>Coming soon</Badge>}
  />
);

export default TwoFactorSection;
