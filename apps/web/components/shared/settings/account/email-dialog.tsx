'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { toAbsoluteUrl } from '@/lib/absolute-url';
import {
  ADMIN_OVERVIEW_PATH,
  ADMIN_SETTINGS_PATH,
  getProfilePath,
} from '@/lib/routes';
import { updateEmailSchema, type UpdateEmailFormData } from '@/schema/account';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AccountFieldDialog from './account-field-dialog';

type EmailDialogProps = {
  email: string;
  username: string;
};

const EmailDialog = ({ email, username }: EmailDialogProps) => {
  const [open, setOpen] = useState(false);
  // Admins have no public profile, so the confirmation link brings them back to their settings.
  const callbackPath = usePathname().startsWith(ADMIN_OVERVIEW_PATH)
    ? ADMIN_SETTINGS_PATH
    : getProfilePath(username);

  const form = useForm<UpdateEmailFormData>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: { email },
  });

  const handleOpenChange = (next: boolean) => {
    if (next) form.reset({ email });
    setOpen(next);
  };

  // The email is only changed once both links are confirmed, so there is nothing to refresh here.
  const onSubmit = async ({ email: newEmail }: UpdateEmailFormData) => {
    await authClient.changeEmail(
      {
        newEmail,
        callbackURL: toAbsoluteUrl(callbackPath),
      },
      {
        onSuccess: () => {
          toast.success(`Check ${email} to approve the change.`);
          setOpen(false);
        },
        onError: ({ error }) => {
          toast.error(error.message);
        },
      },
    );
  };

  const { isSubmitting, isDirty } = form.formState;

  return (
    <AccountFieldDialog
      title='Email address'
      summary='Edit the email address you use to sign in.'
      value={email}
      description={
        <>
          We&apos;ll send a verification email to both your current and your
          new address. The change only takes effect after you confirm from
          both — first from your current inbox, then from the new one.
        </>
      }
      open={open}
      onOpenChange={handleOpenChange}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={isSubmitting}
      canSave={isDirty}
    >
      <Controller
        name='email'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor={field.name} className='sr-only'>
              New email address
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              type='email'
              autoComplete='email'
              placeholder='you@example.com'
              aria-invalid={fieldState.invalid}
              disabled={isSubmitting}
              className='h-10'
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </AccountFieldDialog>
  );
};

export default EmailDialog;
