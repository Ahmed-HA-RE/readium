'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { resetPasswordSchema, type ResetPasswordValues } from '@/schema/auth';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';
import ResetPasswordConfirmation from './reset-password-confirmation';

// The heading lives here rather than on the page so the success state replaces it
// too — otherwise "Reset Password" would sit above the confirmation.
const ResetPasswordForm = ({ token }: { token: string }) => {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ password }: ResetPasswordValues) => {
    await authClient.resetPassword(
      { newPassword: password, token },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: ({ error }) => {
          toast.error(error.message);
        },
      },
    );
  };

  const isPending = form.formState.isSubmitting;

  if (isSuccess) return <ResetPasswordConfirmation />;

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl md:text-3xl xl:text-4xl font-medium tracking-tight capitalize'>
          Reset Password
        </h1>
        <p className='text-sm xl:text-base text-muted-foreground'>
          Choose a new password for your account
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-6'
        noValidate
      >
        <FieldGroup>
          <Controller
            name='password'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type='password'
                  autoComplete='new-password'
                  placeholder='Enter your new password'
                  aria-invalid={fieldState.invalid}
                  className='h-10'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='confirmPassword'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type='password'
                  autoComplete='new-password'
                  placeholder='Confirm your new password'
                  aria-invalid={fieldState.invalid}
                  className='h-10'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <Button
          type='submit'
          size='lg'
          className='h-10 w-full'
          disabled={isPending}
        >
          {isPending ? <Spinner /> : 'Reset password'}
        </Button>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
