'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import { VscReport } from 'react-icons/vsc';
import { ReportReason } from '@repo/types';
import { getErrorMessage } from '@/lib/utils';
import { reportBlog } from '@/lib/actions/report/reportBlog';
import { reportBlogSchema, type ReportBlogFormData } from '@/schema/report';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';

// Ordered as the design reference has them, which is not the enum's order.
const REPORT_REASONS = [
  { value: ReportReason.HARASSMENT, label: 'Harassment' },
  { value: ReportReason.RULES_VIOLATION, label: 'Rules Violation' },
  { value: ReportReason.SPAM, label: 'Spam' },
  { value: ReportReason.AI_GENERATED, label: 'AI-generated' },
];

type ReportBlogProps = {
  slug: string;
};

const ReportBlog = ({ slug }: ReportBlogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const fieldId = useId();

  const form = useForm<ReportBlogFormData>({
    resolver: zodResolver(reportBlogSchema),
  });

  const reason = useWatch({ control: form.control, name: 'reason' });

  const onSubmit = async ({ reason }: ReportBlogFormData) => {
    try {
      await reportBlog({ slug, reason });
      await queryClient.invalidateQueries({ queryKey: ['blogs'] });
      router.refresh();

      toast.success("Got it — thanks for flagging this. We'll review it soon.");
      setIsOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit your report'));
    }
  };

  const isPending = form.formState.isSubmitting;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);

        if (open) form.reset();
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost-plain'
              size='icon'
              aria-label='Blog actions'
              className='absolute top-6 -right-1 z-10 text-muted-foreground'
            />
          }
        >
          <IoEllipsisHorizontal className='size-5' />
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-56 px-2'>
          <DropdownMenuItem
            variant='destructive'
            className='py-2 data-[variant=destructive]:hover:text-red-700 data-[variant=destructive]:focus:bg-transparent data-[variant=destructive]:dark:focus:bg-transparent data-[variant=destructive]:dark:hover:text-red-500'
            onClick={() => setIsOpen(true)}
          >
            <VscReport />
            Report story...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className='gap-6 pt-12 sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-center text-2xl font-bold'>
            Report Story
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-6'
          noValidate
        >
          <Controller
            name='reason'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <RadioGroup
                  name={field.name}
                  value={field.value ?? null}
                  onValueChange={field.onChange}
                  aria-label='Reason for reporting'
                  className='gap-4'
                >
                  {REPORT_REASONS.map(({ value, label }) => (
                    <Field key={value} orientation='horizontal'>
                      <RadioGroupItem
                        value={value}
                        id={`${fieldId}-${value}`}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldLabel
                        htmlFor={`${fieldId}-${value}`}
                        className='font-normal'
                      >
                        {label}
                      </FieldLabel>
                    </Field>
                  ))}
                </RadioGroup>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <DialogFooter className='sm:justify-center'>
            <DialogClose
              render={
                <Button
                  variant='outline'
                  size='lg'
                  type='button'
                  className='rounded-full'
                />
              }
            >
              Cancel
            </DialogClose>

            <Button
              type='submit'
              size='lg'
              variant='destructive'
              className='rounded-full'
              disabled={!reason || isPending}
            >
              {isPending ? (
                <>
                  <Spinner />
                  Reporting...
                </>
              ) : (
                'Report'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportBlog;
