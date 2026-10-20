'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FiAlertTriangle } from 'react-icons/fi';
import { authClient } from '@/lib/auth-client';
import { toAbsoluteUrl } from '@/lib/absolute-url';
import {
  ACCOUNT_DELETION_CONSEQUENCES,
  ADMIN_ACCOUNT_DELETION_CONSEQUENCES,
} from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// Only sends the confirmation email; the account is deleted once its link is opened.
type DeleteAccountDialogProps = {
  email: string;
  isAdmin: boolean;
};

const DeleteAccountDialog = ({ email, isAdmin }: DeleteAccountDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const consequences = isAdmin
    ? ADMIN_ACCOUNT_DELETION_CONSEQUENCES
    : ACCOUNT_DELETION_CONSEQUENCES;

  const sendConfirmation = () => {
    startTransition(async () => {
      await authClient.deleteUser(
        { callbackURL: toAbsoluteUrl('/') },
        {
          onSuccess: () => {
            toast.success(`Check ${email} to confirm deleting your account.`);
            setOpen(false);
          },
          onError: ({ error }) => {
            toast.error(error.message);
          },
        },
      );
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant='destructive-outline' className='rounded-full px-4' />
        }
      >
        Delete account
      </AlertDialogTrigger>

      <AlertDialogContent className='gap-8'>
        <AlertDialogHeader>
          <AlertDialogMedia className='mb-3 bg-destructive/10 text-destructive dark:bg-destructive/20'>
            <FiAlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle className='text-xl'>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            We&apos;ll email you a link to confirm. Once you open it, your
            account is deleted permanently. This action can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='grid gap-1.5 text-sm'>
          <p className='font-medium'>You will lose</p>
          <ul className='list-disc space-y-1 ps-5 text-muted-foreground'>
            {consequences.map((consequence) => (
              <li key={consequence}>{consequence}</li>
            ))}
          </ul>
        </div>

        <AlertDialogFooter className='group-data-[size=sm]/alert-dialog-content:flex'>
          <AlertDialogCancel className='rounded-full' disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant='destructive'
            className='rounded-full'
            disabled={isPending}
            onClick={sendConfirmation}
          >
            {isPending ? (
              <>
                <Spinner />
                Sending...
              </>
            ) : (
              'Send confirmation email'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
