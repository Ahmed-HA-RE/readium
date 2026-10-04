'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import VerifyCodeForm from './verify-code-form';

// The code is only emailed on request, so the input appears after the first send.
const EmailCodePanel = ({ callbackUrl }: { callbackUrl: string }) => {
  const [isSent, setIsSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  // No body: Better Auth finds the user from the 2FA cookie, and the device is trusted at verify.
  const sendCode = () => {
    startTransition(async () => {
      await authClient.twoFactor.sendOtp({}, {
        onSuccess: () => {
          setIsSent(true);
          toast.success('We sent a code to your email');
        },
        onError: ({ error }) => {
          toast.error(error.message);
        },
      });
    });
  };

  if (!isSent) {
    return (
      <div className='flex flex-col gap-4'>
        <p className='text-sm text-muted-foreground'>
          No access to your authenticator app or backup codes? We&apos;ll email
          you a 6-digit code instead.
        </p>
        <Button
          size='lg'
          className='w-full'
          disabled={isPending}
          onClick={sendCode}
        >
          {isPending ? <Spinner /> : 'Send code to my email'}
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <VerifyCodeForm
        method='otp'
        label='Enter the code from your email'
        callbackUrl={callbackUrl}
      />
      <Button
        variant='link'
        className='self-center text-muted-foreground hover:text-foreground'
        disabled={isPending}
        onClick={sendCode}
      >
        {isPending ? <Spinner /> : 'Resend code'}
      </Button>
    </div>
  );
};

export default EmailCodePanel;
