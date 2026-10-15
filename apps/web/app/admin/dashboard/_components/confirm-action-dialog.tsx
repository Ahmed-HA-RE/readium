'use client';

import { useTransition } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type ConfirmActionDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  // Owns the request, the toasts and closing the dialog; the buttons stay disabled until it settles.
  onConfirm: () => Promise<void>;
};

// For risky admin actions that must never run without a confirmation, like a ban.
const ConfirmActionDialog = ({
  title,
  description,
  confirmLabel,
  pendingLabel,
  open,
  setOpen,
  onConfirm,
}: ConfirmActionDialogProps) => {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <AlertDialogContent className='gap-8'>
        <AlertDialogHeader>
          <AlertDialogMedia className='mb-3 bg-destructive/10 text-destructive dark:bg-destructive/20'>
            <FiAlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle className='text-xl'>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className='group-data-[size=sm]/alert-dialog-content:flex'>
          <AlertDialogCancel className='rounded-full' disabled={isPending}>
            Cancel
          </AlertDialogCancel>

          <Button
            variant='destructive'
            className='rounded-full'
            disabled={isPending}
            onClick={() => startTransition(onConfirm)}
          >
            {isPending ? (
              <>
                <Spinner />
                {pendingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmActionDialog;
