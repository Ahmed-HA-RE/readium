'use client';

import { useTransition } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
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
}

const OAuthButton = ({ provider, callbackUrl }: OAuthButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const { label, Icon } = PROVIDERS[provider];

  const signIn = () => {
    startTransition(async () => {
      await authClient.signIn.social({ provider, callbackURL: callbackUrl });
    });
  };

  return (
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
  );
};

export default OAuthButton;
