import { FiArrowUp, FiInfo } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SecuritySection from './security-section';
import TwoFactorDialog from './two-factor-dialog';
import DisableTwoFactorDialog from './disable-two-factor-dialog';
import { SET_UP_PASSWORD_ANCHOR } from './password-section';

type TwoFactorSectionProps = {
  isEnabled: boolean;
  // Better Auth only allows 2FA on accounts with a password.
  hasPassword: boolean;
};

// Without a password the action points back to the set-up alert instead of showing a disabled button.
const TwoFactorSection = ({
  isEnabled,
  hasPassword,
}: TwoFactorSectionProps) => (
  <SecuritySection
    title='Two-factor authentication'
    description='Ask for a one-time code from your authenticator app whenever you sign in with your password, so a leaked password alone is not enough to get into your account.'
    action={
      isEnabled ? (
        <div className='flex items-center gap-3'>
          <Badge variant='success'>On</Badge>
          <DisableTwoFactorDialog />
        </div>
      ) : hasPassword ? (
        <TwoFactorDialog />
      ) : (
        <a
          href={`#${SET_UP_PASSWORD_ANCHOR}`}
          // `cn` lets the size's icon class replace the base one, as `<Button>` does.
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm', shape: 'pill' }),
          )}
        >
          Set up a password
          <FiArrowUp aria-hidden className='animate-bounce' />
        </a>
      )
    }
  >
    {!isEnabled && !hasPassword && (
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <FiInfo aria-hidden className='size-4 shrink-0' />
        Two-factor authentication needs a password. Set one up first.
      </p>
    )}
  </SecuritySection>
);

export default TwoFactorSection;
