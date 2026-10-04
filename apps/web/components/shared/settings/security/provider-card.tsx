'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { LinkedAccount, OAuthProvider } from '@repo/types';
import { authClient } from '@/lib/auth-client';
import { toAbsoluteUrl } from '@/lib/absolute-url';
import { OAUTH_PROVIDERS } from '@/lib/oauth-providers';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const SECURITY_TAB_URL = toAbsoluteUrl('/me/settings?tab=security');

type ProviderCardProps = {
  provider: OAuthProvider;
  account?: LinkedAccount;
  // False when this is the user's only way to sign in.
  canUnlink: boolean;
};

const ProviderCard = ({ provider, account, canUnlink }: ProviderCardProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { label, Icon, iconClassName } = OAUTH_PROVIDERS[provider];

  // Leaves for the provider and comes back to this tab, with `?error=` when linking fails.
  const link = () => {
    startTransition(async () => {
      await authClient.linkSocial(
        {
          provider,
          callbackURL: SECURITY_TAB_URL,
          errorCallbackURL: SECURITY_TAB_URL,
        },
        {
          onError: ({ error }) => {
            toast.error(error.message);
          },
        },
      );
    });
  };

  const unlink = (accountId: string) => {
    startTransition(async () => {
      await authClient.unlinkAccount(
        {
          accountId,
        },
        {
          onSuccess: () => {
            toast.success(`${label} unlinked`);
            router.refresh();
          },
          onError: ({ error }) => {
            toast.error(error.message);
          },
        },
      );
    });
  };

  return (
    <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-xl border p-4'>
      <div className='flex min-w-0 items-center gap-3'>
        <Icon aria-hidden className={cn('size-7 shrink-0', iconClassName)} />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <span className='font-medium'>{label}</span>
          <span className='text-sm text-muted-foreground'>
            {account
              ? `Connected on ${format(account.createdAt, 'PPP')}`
              : 'Not connected'}
          </span>
        </div>
      </div>

      {account ? (
        <Button
          variant='destructive-outline'
          className='ml-auto rounded-full px-4'
          disabled={!canUnlink || isPending}
          onClick={() => unlink(account.id)}
        >
          {isPending ? <Spinner /> : 'Unlink'}
        </Button>
      ) : (
        <Button
          variant='outline'
          className='ml-auto rounded-full px-4'
          disabled={isPending}
          onClick={link}
        >
          {isPending ? <Spinner /> : 'Link'}
        </Button>
      )}
    </div>
  );
};

export default ProviderCard;
