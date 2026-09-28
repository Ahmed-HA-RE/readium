'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiAlertTriangle } from 'react-icons/fi';
import { getErrorMessage } from '@/lib/utils';
import { deleteComment } from '@/lib/actions/comments/deleteComment';
import {
  DELETE_COMMENT_CONFIRMATION,
  deleteCommentSchema,
  type DeleteCommentFormData,
} from '@/schema/comment';
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

type DeleteCommentDialogProps = {
  slug: string;
  commentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DeleteCommentDialog = ({
  slug,
  commentId,
  open,
  setOpen,
}: DeleteCommentDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const labelId = useId();

  const form = useForm<DeleteCommentFormData>({
    resolver: zodResolver(deleteCommentSchema),
    defaultValues: { confirmation: '' },
  });

  const confirmation = useWatch({
    control: form.control,
    name: 'confirmation',
  });

  const isConfirmed = confirmation === DELETE_COMMENT_CONFIRMATION;
  const isPending = form.formState.isSubmitting;

  const onDeleteComment = async () => {
    try {
      await deleteComment({ slug, commentId });

      // Refreshes the blog page's server-rendered response count.
      router.refresh();
      await queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Comment deleted successfully');
      setOpen(!open);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the comment'));
    }
  };

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
          <AlertDialogTitle className='text-xl'>
            Delete comment
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this comment? This action can&apos;t
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form
          onSubmit={form.handleSubmit(onDeleteComment)}
          className='grid gap-6'
        >
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
                    {DELETE_COMMENT_CONFIRMATION}
                  </strong>{' '}
                  in the box below
                </FieldLabel>

                <Input
                  {...field}
                  aria-labelledby={labelId}
                  placeholder={DELETE_COMMENT_CONFIRMATION}
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

export default DeleteCommentDialog;
