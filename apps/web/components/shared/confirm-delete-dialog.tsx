'use client';

import { useId } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiAlertTriangle } from 'react-icons/fi';
import {
  DELETE_CONFIRMATION,
  confirmDeleteSchema,
  type ConfirmDeleteFormData,
} from '@/schema/confirmation';
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

type ConfirmDeleteDialogProps = {
  title: string;
  description: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  // Owns the request, the toasts and closing the dialog; the submit stays pending until it settles.
  onConfirm: () => Promise<void>;
};

const ConfirmDeleteDialog = ({
  title,
  description,
  open,
  setOpen,
  onConfirm,
}: ConfirmDeleteDialogProps) => {
  const labelId = useId();

  const form = useForm<ConfirmDeleteFormData>({
    resolver: zodResolver(confirmDeleteSchema),
    defaultValues: { confirmation: '' },
  });

  const confirmation = useWatch({
    control: form.control,
    name: 'confirmation',
  });

  const isConfirmed = confirmation === DELETE_CONFIRMATION;
  const isPending = form.formState.isSubmitting;

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) form.reset();
      }}
    >
      <AlertDialogContent className='gap-8'>
        <AlertDialogHeader>
          <AlertDialogMedia className='mb-3 bg-destructive/10 text-destructive dark:bg-destructive/20'>
            <FiAlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle className='text-xl'>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={form.handleSubmit(onConfirm)} className='grid gap-6'>
          <Controller
            name='confirmation'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className='gap-3'>
                <FieldLabel
                  id={labelId}
                  className='block font-normal select-text'
                >
                  To confirm, type{' '}
                  <strong className='rounded bg-muted px-1.5 py-0.5 font-mono font-extrabold'>
                    {DELETE_CONFIRMATION}
                  </strong>{' '}
                  in the box below
                </FieldLabel>

                <Input
                  {...field}
                  aria-labelledby={labelId}
                  placeholder={DELETE_CONFIRMATION}
                  autoComplete='off'
                  spellCheck={false}
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <AlertDialogFooter className='group-data-[size=sm]/alert-dialog-content:flex'>
            <AlertDialogCancel className='rounded-full' disabled={isPending}>
              Cancel
            </AlertDialogCancel>

            <Button
              type='submit'
              variant='destructive'
              className='rounded-full'
              disabled={!isConfirmed || isPending}
            >
              {isPending ? (
                <>
                  <Spinner />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDeleteDialog;
