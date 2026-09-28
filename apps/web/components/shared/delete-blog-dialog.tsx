'use client';

import { useId, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiAlertTriangle } from 'react-icons/fi';
import type { Blog } from '@repo/types';
import { deleteBlog } from '@/lib/actions/blogs/deleteBlog';
import { createDeleteBlogSchema, type DeleteBlogFormData } from '@/schema/blog';
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

type DeleteBlogDialogProps = {
  slug: string;
  title: string;
  // Absent where the caller has no counts, e.g. the likes and bookmarks lists.
  counts?: Blog['_count'];
  // Where to go afterwards when the current page is the deleted blog.
  redirectTo?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const pluralize = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? '' : 's'}`;

const formatStats = (counts?: Blog['_count']) =>
  counts
    ? `${pluralize(counts.likes, 'like')}, ${pluralize(counts.comments, 'response')} and ${pluralize(counts.bookmarks, 'bookmark')}`
    : 'every like, response and bookmark';

const DeleteBlogDialog = ({
  slug,
  title,
  counts,
  redirectTo,
  open,
  setOpen,
}: DeleteBlogDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const labelId = useId();

  const schema = useMemo(() => createDeleteBlogSchema(title), [title]);

  const form = useForm<DeleteBlogFormData>({
    resolver: zodResolver(schema),
    defaultValues: { confirmation: '' },
  });

  const confirmation = useWatch({
    control: form.control,
    name: 'confirmation',
  });

  const isConfirmed = confirmation === title;
  const isPending = form.formState.isSubmitting;

  // Unknown counts are treated as activity, so the warning errs on the side of showing.
  const hasActivity =
    !counts || counts.likes + counts.comments + counts.bookmarks > 0;

  const onDeleteBlog = async () => {
    const { error } = await deleteBlog(slug);

    if (error) {
      toast.error(error);
      return;
    }

    // Comments too, since the Comments tab links each one to its blog.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['blogs'] }),
      queryClient.invalidateQueries({ queryKey: ['comments'] }),
    ]);
    toast.success('Story deleted successfully');
    setOpen(false);

    if (redirectTo) {
      router.replace(redirectTo);
    } else {
      // For the trending blogs sidebar as it fetch on the server component
      router.refresh();
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
          <AlertDialogTitle className='text-xl'>Delete story</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this story? This action can&apos;t
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='grid gap-4 text-sm'>
          <div className='grid gap-1.5'>
            <p className='font-medium'>You will lose</p>
            <ul className='list-disc space-y-1 ps-5 text-muted-foreground'>
              <li>The story, its cover image and its tags</li>
              {hasActivity && <li>Its stats: {formatStats(counts)}</li>}
            </ul>
          </div>

          {hasActivity && (
            <div className='grid gap-1.5'>
              <p className='font-medium'>Your readers will lose</p>
              <ul className='list-disc space-y-1 ps-5 text-muted-foreground'>
                <li>The responses they wrote on it</li>
                <li>Their likes on it</li>
                <li>The story from their bookmarked reading lists</li>
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onDeleteBlog)} className='grid gap-6'>
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
                  <strong className='rounded bg-muted px-1.5 py-0.5 font-mono font-extrabold break-words'>
                    {title}
                  </strong>{' '}
                  in the box below
                </FieldLabel>

                <Input
                  {...field}
                  aria-labelledby={labelId}
                  placeholder={title}
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

export default DeleteBlogDialog;
