'use client';

import type { FormEventHandler } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type AccountFieldDialogProps = {
  title: string;
  // Shown under the title on the settings row.
  summary: string;
  // The row's right side, usually the current value.
  value?: React.ReactNode;
  description: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isPending: boolean;
  canSave: boolean;
  children: React.ReactNode;
};

const AccountFieldDialog = ({
  title,
  summary,
  value,
  description,
  open,
  onOpenChange,
  onSubmit,
  isPending,
  canSave,
  children,
}: AccountFieldDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger className='flex w-full cursor-pointer items-center justify-between gap-6 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50'>
      <span className='flex min-w-0 flex-col gap-1'>
        <span className='text-base'>{title}</span>
        <span className='text-sm text-muted-foreground'>{summary}</span>
      </span>
      {value && (
        <span className='max-w-1/2 truncate text-sm text-muted-foreground'>
          {value}
        </span>
      )}
    </DialogTrigger>

    <DialogContent className='gap-6 p-6 sm:max-w-md'>
      <DialogHeader className='items-center text-center'>
        <DialogTitle className='text-xl'>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} noValidate className='grid gap-6'>
        {children}

        <DialogFooter>
          <DialogClose
            render={<Button variant='outline' className='rounded-full' />}
            disabled={isPending}
          >
            Cancel
          </DialogClose>
          <Button
            type='submit'
            className='rounded-full'
            disabled={!canSave || isPending}
          >
            {isPending ? (
              <>
                <Spinner />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export default AccountFieldDialog;
