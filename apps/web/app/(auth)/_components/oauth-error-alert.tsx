import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Sign-in was cancelled. Pick a provider to try again.',
  account_already_linked_to_different_user:
    'This account is already linked to another Readium user.',
  email_not_found:
    "Your provider didn't share an email address. Try another way to sign in.",
  NAME_UNAVAILABLE:
    "We couldn't create a username for this account. Please sign up with email instead.",
  BANNED_USER: 'This account has been banned.',
};

const FALLBACK_MESSAGE = "We couldn't sign you in. Please try again.";

const OAuthErrorAlert = ({ error }: { error?: string }) => {
  if (!error) return null;

  return (
    <Alert className='border-none' variant='destructive'>
      <TriangleAlertIcon />
      <AlertTitle>{OAUTH_ERROR_MESSAGES[error] ?? FALLBACK_MESSAGE}</AlertTitle>
    </Alert>
  );
};

export default OAuthErrorAlert;
