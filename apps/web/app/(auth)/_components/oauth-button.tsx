'use client';

import { useEffect, useState, useTransition } from 'react';
import type { OAuthProvider } from '@repo/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { OAUTH_PROVIDERS } from '@/lib/oauth-providers';
import { Spinner } from '@/components/ui/spinner';

interface OAuthButtonProps {
  provider: OAuthProvider;
  callbackUrl: string;
  errorCallbackUrl?: string;
  showLastUsed?: boolean;
}

const OAuthButton = ({
  provider,
  callbackUrl,
  errorCallbackUrl,
  showLastUsed = false,
}: OAuthButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const [isLastUsed, setIsLastUsed] = useState(false);
  const { label, Icon, iconClassName } = OAUTH_PROVIDERS[provider];

  // The cookie only exists in the browser, so this reads after mount to keep the
  // server and client renders identical.
  useEffect(() => {
    if (showLastUsed) setIsLastUsed(authClient.isLastUsedLoginMethod(provider));
  }, [provider, showLastUsed]);

  const signIn = () => {
    startTransition(async () => {
      await authClient.signIn.social({
        provider,
        callbackURL: callbackUrl,
        errorCallbackURL: errorCallbackUrl,
      });
    });
  };

  return (
    <div className='relative'>
      {isLastUsed && (
        <Badge className='absolute -top-3 right-0 z-10 bg-foreground text-background shadow-sm'>
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
            <Icon className={iconClassName} />
            {label}
          </>
        )}
      </Button>
    </div>
  );
};

export default OAuthButton;
