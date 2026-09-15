'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { loginSchema, type LoginValues } from '@/schema/auth';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { Spinner } from '@/components/ui/spinner';

interface LoginFormProps {
  // Where the user goes after signing in, relative so the router can soft-navigate.
  callbackUrl: string;
  // Absolute, because Better Auth puts it in the verification email it may send.
  verifyRedirectUrl: string;
}

const LoginForm = ({ callbackUrl, verifyRedirectUrl }: LoginFormProps) => {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    await authClient.signIn.email(
      { ...values, callbackURL: verifyRedirectUrl },
      {
        onSuccess: () => {
          router.push(callbackUrl);
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

        <Controller
          name='password'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <div className='flex items-center justify-between gap-2'>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Link
                  href='/forgot-password'
                  className='text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                {...field}
                id={field.name}
                type='password'
                autoComplete='current-password'
                placeholder='Enter your password'
                aria-invalid={fieldState.invalid}
                className='h-10'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
        {isPending ? <Spinner /> : 'Sign in'}
      </Button>
    </form>
  );
};

export default LoginForm;
