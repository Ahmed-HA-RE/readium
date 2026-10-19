'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FaEye, FaSignOutAlt, FaStripeS, FaUserSlash } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { STRIPE_DASHBOARD_URL } from '@/lib/constants';
import ConfirmActionDialog from './confirm-action-dialog';

const ICON_CLASS = 'size-4';

type UserActionsMenuProps = {
  userId: string;
  name: string;
  banned: boolean | null;
  stripeCustomerId: string | null;
};

const UserActionsMenu = ({
  userId,
  name,
  banned,
  stripeCustomerId,
}: UserActionsMenuProps) => {
  const [openDialog, setOpenDialog] = useState<'ban' | 'revoke' | null>(null);
  const queryClient = useQueryClient();

  const closeDialog = () => setOpenDialog(null);

  // Better Auth returns `{ error }` instead of throwing.
  const onBan = async () => {
    const { error } = await authClient.admin.banUser({ userId });

    if (error) {
      toast.error(error.message || 'Could not ban the user');
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success(`${name} has been banned`);
    closeDialog();
  };

  const onRevokeSessions = async () => {
    const { error } = await authClient.admin.revokeUserSessions({ userId });

    if (error) {
      toast.error(error.message || "Could not revoke the user's sessions");
      return;
    }

    toast.success(`${name} has been signed out everywhere`);
    closeDialog();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              aria-label={`Actions for ${name}`}
            />
          }
        >
          <BsThreeDotsVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuItem
            render={
              <Link
                href={`/admin/dashboard/users/${encodeURIComponent(name)}`}
              />
            }
          >
            <FaEye className={ICON_CLASS} />
            View User
          </DropdownMenuItem>
          {/* The column is nullable, so the item only shows for users Stripe knows about. */}
          {stripeCustomerId && (
            <DropdownMenuItem
              render={
                <a
                  href={`${STRIPE_DASHBOARD_URL}/customers/${encodeURIComponent(stripeCustomerId)}`}
                  target='_blank'
                  rel='noopener noreferrer'
                />
              }
            >
              <FaStripeS className={`${ICON_CLASS} text-[#635BFF]`} />
              View Customer
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            onClick={() => setOpenDialog('revoke')}
          >
            <FaSignOutAlt className={ICON_CLASS} />
            Revoke User Sessions
          </DropdownMenuItem>
          {/* Banning an already banned user changes nothing, so the item is hidden. */}
          {!banned && (
            <DropdownMenuItem
              variant='destructive'
              onClick={() => setOpenDialog('ban')}
            >
              <FaUserSlash className={ICON_CLASS} />
              Ban User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        title={`Ban ${name}?`}
        description="They will be signed out everywhere and can't sign in again. Their Pro subscription, if any, is cancelled immediately without a refund."
        confirmLabel='Ban user'
        pendingLabel='Banning...'
        open={openDialog === 'ban'}
        setOpen={(open) => setOpenDialog(open ? 'ban' : null)}
        onConfirm={onBan}
      />

      <ConfirmActionDialog
        title={`Revoke ${name}'s sessions?`}
        description='They will be signed out on every device, but can sign in again.'
        confirmLabel='Revoke sessions'
        pendingLabel='Revoking...'
        open={openDialog === 'revoke'}
        setOpen={(open) => setOpenDialog(open ? 'revoke' : null)}
        onConfirm={onRevokeSessions}
      />
    </>
  );
};

export default UserActionsMenu;
