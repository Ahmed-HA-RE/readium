'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import { GoPencil, GoTrash } from 'react-icons/go';
import { VscReport } from 'react-icons/vsc';
import { ReportReason, type Blog } from '@repo/types';
import { cn, getBlogEditPath, getErrorMessage } from '@/lib/utils';
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
import DeleteBlogDialog from './delete-blog-dialog';

// Ordered as the design reference has them, which is not the enum's order.
const REPORT_REASONS = [
  { value: ReportReason.HARASSMENT, label: 'Harassment' },
  { value: ReportReason.RULES_VIOLATION, label: 'Rules Violation' },
  { value: ReportReason.SPAM, label: 'Spam' },
  { value: ReportReason.AI_GENERATED, label: 'AI-generated' },
];

type BlogActionsMenuProps = {
  slug: string;
  title: string;
  isOwnBlog: boolean;
  counts?: Blog['_count'];
  // Set on the blog page, which no longer exists once the blog is deleted.
  redirectOnDelete?: string;
  // Positions the trigger, which differs between the card and the blog page.
  className?: string;
};

type MenuProps = Omit<BlogActionsMenuProps, 'isOwnBlog'>;

const MenuTrigger = ({ className }: { className?: string }) => (
  <DropdownMenuTrigger
    render={
      <Button
        variant='ghost-plain'
        size='icon'
        aria-label='Blog actions'
        className={cn('text-muted-foreground', className)}
      />
    }
  >
    <IoEllipsisHorizontal className='size-5' />
  </DropdownMenuTrigger>
);

const OwnerMenu = ({
  slug,
  title,
  counts,
  redirectOnDelete,
  className,
}: MenuProps) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <MenuTrigger className={className} />

        <DropdownMenuContent align='end' className='w-56 px-2 space-y-1'>
          <DropdownMenuItem
            variant='ghost-plain'
            render={<Link href={getBlogEditPath(slug)} />}
          >
            <GoPencil />
            Edit story
          </DropdownMenuItem>

          <DropdownMenuItem
            variant='destructive'
            className='data-[variant=destructive]:hover:text-red-700 data-[variant=destructive]:focus:bg-transparent data-[variant=destructive]:dark:focus:bg-transparent data-[variant=destructive]:dark:hover:text-red-500'
            onClick={() => setIsDeleteOpen(true)}
          >
            <GoTrash />
            Delete story
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteBlogDialog
        slug={slug}
        title={title}
        counts={counts}
        redirectTo={redirectOnDelete}
        open={isDeleteOpen}
        setOpen={setIsDeleteOpen}
      />
    </>
  );
};

const ReportMenu = ({ slug, className }: MenuProps) => {
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
        <MenuTrigger className={className} />

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

// The owner edits or deletes, so their menu skips the report form entirely.
const BlogActionsMenu = ({ isOwnBlog, ...props }: BlogActionsMenuProps) =>
  isOwnBlog ? <OwnerMenu {...props} /> : <ReportMenu {...props} />;

export default BlogActionsMenu;
