'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from '@/schema/security';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const FIELDS = [
  {
    name: 'currentPassword',
    label: 'Current password',
    autoComplete: 'current-password',
  },
  { name: 'newPassword', label: 'New password', autoComplete: 'new-password' },
  {
    name: 'confirmPassword',
    label: 'Confirm password',
    autoComplete: 'new-password',
  },
] as const;

const ChangePasswordForm = ({ email }: { email: string }) => {
  const queryClient = useQueryClient();

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  // Every other device is signed out, so the sessions list is refetched.
  const onSubmit = async ({
    currentPassword,
    newPassword,
  }: ChangePasswordValues) => {
    await authClient.changePassword(
      { currentPassword, newPassword, revokeOtherSessions: true },
      {
        onSuccess: async () => {
          form.reset();
          toast.success('Password updated. Your other devices were signed out.');
          await queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
        onError: ({ error }) => {
          toast.error(error.message);
        },
      },
    );
  };

  const isPending = form.formState.isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className='flex w-full flex-col gap-6'
    >
      {/* Tells password managers which account the new password belongs to. */}
      <input
        type='email'
        name='username'
        autoComplete='username'
        value={email}
        readOnly
        hidden
      />
      <FieldGroup>
        {FIELDS.map(({ name, label, autoComplete }) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  {label}
                  <span aria-hidden className='text-destructive'>
                    *
                  </span>
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type='password'
                  autoComplete={autoComplete}
                  required
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                  large
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}
      </FieldGroup>

      <Button
        type='submit'
        size='lg'
        className='self-end rounded-full px-5'
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner />
            Updating...
          </>
        ) : (
          'Update password'
        )}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
