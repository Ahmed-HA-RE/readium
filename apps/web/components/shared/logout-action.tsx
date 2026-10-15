'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MdLogout } from 'react-icons/md';
import { cn } from 'cn';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';

interface LogoutActionProps {
  label: string;
  className?: string;
  iconClassName?: string;
}

// The sign-out item shared by the user and admin menus; it must render inside a `DropdownMenu`.
const LogoutAction = ({
  label,
  className,
  iconClassName,
}: LogoutActionProps) => {
  const [isSigningOut, startSignOut] = useTransition();
  const router = useRouter();

  const signOut = () =>
    startSignOut(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/');
            router.refresh();
          },
          onError: ({ error }) => {
            toast.error(error.message || 'Could not sign you out');
          },
        },
      });
    });

  return (
    <DropdownMenuItem
      variant='destructive'
      onClick={signOut}
      disabled={isSigningOut}
      className={className}
    >
      <MdLogout className={cn('size-4', iconClassName)} />
      {isSigningOut ? 'Signing out…' : label}
    </DropdownMenuItem>
  );
};

export default LogoutAction;
