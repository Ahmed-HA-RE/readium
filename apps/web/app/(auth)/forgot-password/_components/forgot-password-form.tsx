'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FaArrowLeft } from 'react-icons/fa6';
import { toast } from 'sonner';
import { cn } from 'cn';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/schema/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth-client';

// Absolute, because Better Auth resolves `redirectTo` against its own baseURL —
// the backend — and then puts it in the emailed link as `callbackURL`.
const ForgotPasswordForm = ({
  resetPasswordUrl,
}: {
  resetPasswordUrl: string;
}) => {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    await authClient.requestPasswordReset(
      { email, redirectTo: resetPasswordUrl },
      {
        onSuccess: () => {
          form.reset();
          toast.success(
            'If that email has an account, a reset link is on its way.',
          );
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
      className='flex flex-col gap-6'
      noValidate
    >
      <FieldGroup>
        <Controller
          name='email'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='email'
                autoComplete='email'
                placeholder='you@example.com'
                aria-invalid={fieldState.invalid}
                className='h-10'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <div className='flex flex-col gap-4'>
        <Button
          type='submit'
          size='lg'
          className='h-10 w-full'
          disabled={isPending}
        >
          {isPending ? <Spinner /> : 'Send reset link'}
        </Button>

        <Link
          href='/login'
          className={cn(
            buttonVariants({ size: 'lg', variant: 'ghost' }),
            'group h-10 w-full',
          )}
        >
          <FaArrowLeft className='transition-transform duration-200 group-hover:-translate-x-0.5' />
          Back to login
        </Link>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
