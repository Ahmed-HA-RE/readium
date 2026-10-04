'use client';

import { useEffect, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { OAuthProvider, type LinkedAccount } from '@repo/types';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import SecuritySection from './security-section';
import ProviderCard from './provider-card';

// The `?error=` codes Better Auth's link callback redirects back with.
const LINK_ERRORS: Record<string, string> = {
  email_does_not_match:
    'That account uses a different email address than yours, so it could not be linked.',
  account_already_linked_to_different_user:
    'That account is already linked to another Readium user.',
};

const PROVIDER_IDS: string[] = Object.values(OAuthProvider);

const LinkedAccountsSection = ({ accounts }: { accounts: LinkedAccount[] }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const linked = accounts.filter(({ providerId }) =>
    PROVIDER_IDS.includes(providerId),
  );
  const hasPassword = accounts.some(
    ({ providerId }) => providerId === 'credential',
  );
  // Better Auth refuses to unlink the last account of any kind, password included.
  const canUnlink = accounts.length > 1;

  const linkError = searchParams.get('error');

  useEffect(() => {
    if (!linkError) return;
    toast.error(LINK_ERRORS[linkError] ?? 'Could not link that account.');
    router.replace(`${pathname}?tab=security`, { scroll: false });
  }, [linkError, pathname, router]);

  // Only offered with a password, so unlinking every provider never locks the user out.
  const unlinkAll = () => {
    startTransition(async () => {
      for (const { id } of linked) {
        const { error } = await authClient.unlinkAccount({ accountId: id });
        if (error) {
          toast.error(error.message);
          break;
        }
      }
      router.refresh();
    });
  };

  return (
    <SecuritySection
      title='Connected accounts'
      description='Link Google, GitHub or Twitch to sign in with them instead of your password. Each account must use the same email as your Readium account.'
      action={
        <Button
          variant='destructive-outline'
          className='rounded-full px-4'
          disabled={!hasPassword || linked.length === 0 || isPending}
          onClick={unlinkAll}
        >
          {isPending ? <Spinner /> : 'Unlink all'}
        </Button>
      }
    >
      <div className='grid gap-3'>
        {Object.values(OAuthProvider).map((provider) => (
          <ProviderCard
            key={provider}
            provider={provider}
            account={linked.find(({ providerId }) => providerId === provider)}
            canUnlink={canUnlink}
          />
        ))}
      </div>

      {!hasPassword && (
        <p className='text-sm text-muted-foreground'>
          Set up a password above to unlink every account at once.
          {!canUnlink && ' Your only connected account cannot be unlinked yet.'}
        </p>
      )}
    </SecuritySection>
  );
};

export default LinkedAccountsSection;
