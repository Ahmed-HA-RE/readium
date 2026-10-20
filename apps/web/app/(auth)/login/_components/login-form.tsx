'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { loginSchema, type LoginValues } from '@/schema/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { toAbsoluteUrl } from '@/lib/absolute-url';
import { ADMIN_OVERVIEW_PATH } from '@/lib/routes';
import { Spinner } from '@/components/ui/spinner';

interface LoginFormProps {
  // `/login?callbackUrl=…`, absolute because Better Auth also puts it in the verification email.
  verifyRedirectUrl: string;
}

const LoginForm = ({ verifyRedirectUrl }: LoginFormProps) => {
  const [isLastUsed, setIsLastUsed] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Reads after mount because the cookie is browser-only, same as the OAuth buttons.
  useEffect(() => setIsLastUsed(authClient.isLastUsedLoginMethod('email')), []);

  const onSubmit = async (values: LoginValues) => {
    await authClient.signIn.email(
      { ...values, callbackURL: verifyRedirectUrl },
      {
        onSuccess: ({ data }) => {
          if (data.user?.role === 'admin')
            data.url = toAbsoluteUrl(ADMIN_OVERVIEW_PATH);
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

      <div className='relative'>
        {isLastUsed && (
          <Badge className='absolute -top-1 right-0 z-10 bg-foreground text-background shadow-sm'>
            Last used
          </Badge>
        )}
        <Button
          type='submit'
          size='lg'
          className='h-10 w-full'
          disabled={isPending}
        >
          {isPending ? <Spinner /> : 'Sign in'}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
