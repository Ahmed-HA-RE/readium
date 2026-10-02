'use client';

import { useId, useTransition } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { toAbsoluteUrl } from '@/lib/absolute-url';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// Shown instead of the change form to OAuth-only users; Better Auth's reset flow creates the credential account.
const SetUpPasswordAlert = ({ email }: { email: string }) => {
  const headingId = useId();
  const [isPending, startTransition] = useTransition();

  const sendSetupLink = () => {
    startTransition(async () => {
      await authClient.requestPasswordReset(
        { email, redirectTo: toAbsoluteUrl('/reset-password?mode=setup') },
        {
          onSuccess: () => {
            toast.success(`We sent a link to ${email} to set your password.`);
          },
          onError: ({ error }) => {
            toast.error(error.message);
          },
        },
      );
    });
  };

  return (
    // A static section, so not the live `alert` role the component defaults to.
    <Alert
      variant='warning'
      role='region'
      aria-labelledby={headingId}
      className='flex flex-col items-center gap-2 px-4 py-5 text-center'
    >
      <AlertTitle id={headingId} className='text-lg font-semibold'>
        Password
      </AlertTitle>
      <AlertDescription className='max-w-xl'>
        You signed up with a social account, so you don&apos;t have a password
        yet. Add one to sign in with your email as well, and to turn on
        two-factor authentication. We&apos;ll email you a link to create it.
      </AlertDescription>
      <Button
        variant='warning'
        className='mt-3 rounded-full px-5'
        disabled={isPending}
        onClick={sendSetupLink}
      >
        {isPending ? <Spinner /> : 'Send setup link'}
      </Button>
    </Alert>
  );
};

export default SetUpPasswordAlert;
