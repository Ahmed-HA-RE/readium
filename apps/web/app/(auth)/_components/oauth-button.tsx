'use client';

import { useEffect, useState, useTransition } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { Spinner } from '@/components/ui/spinner';

type OAuthProvider = 'google' | 'github';

const PROVIDERS = {
  google: { label: 'Google', Icon: FcGoogle },
  github: { label: 'GitHub', Icon: FaGithub },
} as const;

interface OAuthButtonProps {
  provider: OAuthProvider;
  callbackUrl: string;
  showLastUsed?: boolean;
}

const OAuthButton = ({
  provider,
  callbackUrl,
  showLastUsed = false,
}: OAuthButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const [isLastUsed, setIsLastUsed] = useState(false);
  const { label, Icon } = PROVIDERS[provider];

  // The cookie only exists in the browser, so this reads after mount to keep the
  // server and client renders identical.
  useEffect(() => {
    if (showLastUsed) setIsLastUsed(authClient.isLastUsedLoginMethod(provider));
  }, [provider, showLastUsed]);

  const signIn = () => {
    startTransition(async () => {
      await authClient.signIn.social({ provider, callbackURL: callbackUrl });
    });
  };

  return (
    <div className='relative'>
      {isLastUsed && (
        <Badge className='absolute -top-2 right-0 z-10 bg-foreground text-background shadow-sm'>
          Last used
        </Badge>
      )}
      <Button
        type='button'
        variant='outline'
        size='lg'
        disabled={isPending}
        onClick={signIn}
        className='h-10 w-full'
      >
        {isPending ? (
          <Spinner />
        ) : (
          <>
            <Icon />
            {label}
          </>
        )}
      </Button>
    </div>
  );
};

export default OAuthButton;
