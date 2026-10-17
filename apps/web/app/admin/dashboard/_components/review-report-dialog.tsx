'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ModerationAction, ReportStatus } from '@repo/types';
import { updateAdminReportStatus } from '@/lib/actions/admin/updateAdminReportStatus';
import { reviewReportSchema, type ReviewReportFormData } from '@/schema/report';
import { Button } from '@/components/ui/button';
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const STATUS_ITEMS = [
  { value: ReportStatus.RESOLVED, label: 'Resolved' },
  { value: ReportStatus.REJECTED, label: 'Rejected' },
];

const ACTION_ITEMS = [
  { value: ModerationAction.WARNING, label: 'Send a warning' },
  { value: ModerationAction.TEMPORARY_BAN, label: 'Ban for 30 days' },
  { value: ModerationAction.PERMANENT_BAN, label: 'Ban permanently' },
];

type ReviewReportDialogProps = {
  reportId: string;
  blogTitle: string;
};

const ReviewReportDialog = ({ reportId, blogTitle }: ReviewReportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const statusId = useId();
  const actionId = useId();

  const form = useForm<ReviewReportFormData>({
    resolver: zodResolver(reviewReportSchema),
  });

  const status = useWatch({ control: form.control, name: 'status' });
  const isRejected = status === ReportStatus.REJECTED;

  const onSubmit = async ({ status, action }: ReviewReportFormData) => {
    const { error, banFailed } = await updateAdminReportStatus({
      reportId,
      status,
      action,
    });

    if (error) {
      toast.error(error);
      return;
    }

    // Resolving unpublishes the blog, and its action may ban the author.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
      queryClient.invalidateQueries({ queryKey: ['blogs'] }),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
    ]);
    // The pending count and the cards are server-rendered, so the page re-renders to pick up the review.
    router.refresh();

    if (banFailed) {
      toast.warning(
        "Report resolved and the story is unpublished, but the ban didn't go through. Ban the author from the users table.",
      );
    } else {
      toast.success(
        status === ReportStatus.RESOLVED
          ? 'Report resolved and the story is unpublished'
          : 'Report rejected',
      );
    }
    setIsOpen(false);
  };

  const isPending = form.formState.isSubmitting;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (isPending) return;
        setIsOpen(open);

        if (open) form.reset();
      }}
    >
      <DialogTrigger
        render={<Button variant='outline' size='sm' className='rounded-full' />}
      >
        Review
      </DialogTrigger>

      <DialogContent className='gap-6 sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Review Report</DialogTitle>
          <DialogDescription>
            Update the report status and choose what action to take on &ldquo;
            {blogTitle}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-6'
          noValidate
        >
          <Controller
            name='status'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={statusId}>Status</FieldLabel>
                <Select
                  items={STATUS_ITEMS}
                  value={field.value ?? null}
                  onValueChange={(value) => {
                    field.onChange(value);

                    // A disabled select keeps its value, so a chosen action is cleared with its error.
                    if (value === ReportStatus.REJECTED) {
                      form.setValue('action', undefined);
                      form.clearErrors('action');
                    }
                  }}
                >
                  <SelectTrigger
                    id={statusId}
                    className='w-full'
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder='Choose a status' />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {STATUS_ITEMS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='action'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} data-disabled={isRejected}>
                <FieldLabel htmlFor={actionId}>Action</FieldLabel>
                <Select
                  items={ACTION_ITEMS}
                  value={field.value ?? null}
                  onValueChange={field.onChange}
                  disabled={isRejected}
                >
                  <SelectTrigger
                    id={actionId}
                    className='w-full'
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder='Choose an action' />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {ACTION_ITEMS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {isRejected
                    ? 'A rejected report takes no action.'
                    : 'Resolving also unpublishes the story. A ban signs the author out and cancels their subscription.'}
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <DialogFooter>
            <DialogClose
              render={
                <Button
                  variant='outline'
                  type='button'
                  className='rounded-full'
                  disabled={isPending}
                />
              }
            >
              Cancel
            </DialogClose>

            <Button type='submit' className='rounded-full' disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                'Save review'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewReportDialog;
