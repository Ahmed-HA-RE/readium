'use client';

import { useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { useMySessions } from '@/hooks/user';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import RetryError from '@/components/shared/retry-error';
import SecuritySection from './security-section';
import SessionCard from './session-card';

const SessionsSection = ({ currentSessionId }: { currentSessionId: string }) => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { data: sessions, isPending: isLoading, isError, refetch } =
    useMySessions();

  // This device first, then the most recent sign-in.
  const sorted = [...(sessions ?? [])].sort(
    (a, b) =>
      Number(b.id === currentSessionId) - Number(a.id === currentSessionId) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const hasOtherSessions = sorted.some(({ id }) => id !== currentSessionId);

  // Keeps this device signed in.
  const revokeOthers = () => {
    startTransition(async () => {
      await authClient.revokeOtherSessions({
        fetchOptions: {
          onSuccess: async () => {
            toast.success('Signed out of every other device');
            await queryClient.invalidateQueries({ queryKey: ['sessions'] });
          },
          onError: ({ error }) => {
            toast.error(error.message);
          },
        },
      });
    });
  };

  return (
    <SecuritySection
      title='Active sessions'
      description="Every device signed in to your account right now. Revoke any session you don't recognise; revoking all of them signs out every device except this one."
      action={
        <Button
          variant='destructive-outline'
          className='rounded-full px-4'
          disabled={!hasOtherSessions || isPending}
          onClick={revokeOthers}
        >
          {isPending ? <Spinner /> : 'Revoke all'}
        </Button>
      }
    >
      {isLoading ? (
        <div className='grid gap-3'>
          <Skeleton className='h-20 rounded-xl' />
          <Skeleton className='h-20 rounded-xl' />
        </div>
      ) : isError ? (
        <RetryError
          message='Could not load your sessions.'
          onRetry={() => void refetch()}
          className='py-8'
        />
      ) : (
        <div className='grid gap-3'>
          {sorted.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isCurrent={session.id === currentSessionId}
            />
          ))}
        </div>
      )}
    </SecuritySection>
  );
};

export default SessionsSection;
