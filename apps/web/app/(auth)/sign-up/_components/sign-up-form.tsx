'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useDebounce } from 'use-debounce';
import { FaCheck, FaXmark } from 'react-icons/fa6';
import { toast } from 'sonner';
import { useIsUsernameTaken } from '@/hooks/user';
import { signUpSchema, type SignUpValues } from '@/schema/auth';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { authClient } from '@/lib/auth-client';
import { Spinner } from '@/components/ui/spinner';

const SignUpForm = ({ verifyRedirectUrl }: { verifyRedirectUrl: string }) => {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const name = useWatch({ control: form.control, name: 'name' });
  const [debouncedName] = useDebounce(name, 400);
  const { data: nameIsTaken, isFetching: isCheckingName } =
    useIsUsernameTaken(debouncedName);

  const onSubmit = async ({ name, email, password }: SignUpValues) => {
    await authClient.signUp.email(
      { name, email, password, callbackURL: verifyRedirectUrl },
      {
        onSuccess: () => {
          form.reset();
          toast.success('Account created. Check your email to verify it.');
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
          name='name'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <InputGroup className='h-10'>
                <InputGroupInput
                  {...field}
                  id={field.name}
                  autoComplete='name'
                  placeholder='Enter your name'
                  aria-invalid={fieldState.invalid || nameIsTaken}
                />
                {!fieldState.invalid && (
                  <InputGroupAddon align='inline-end'>
                    {isCheckingName ? (
                      <Spinner />
                    ) : nameIsTaken === true ? (
                      <FaXmark className='text-red-600' />
                    ) : nameIsTaken === false ? (
                      <FaCheck className='text-emerald-600' />
                    ) : null}
                  </InputGroupAddon>
                )}
              </InputGroup>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                nameIsTaken && (
                  <FieldError
                    errors={[{ message: 'That name is already taken' }]}
                  />
                )
              )}
            </Field>
          )}
        />

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
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='password'
                autoComplete='new-password'
                placeholder='Enter your password'
                aria-invalid={fieldState.invalid}
                className='h-10'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='confirmPassword'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type='password'
                autoComplete='new-password'
                placeholder='Confirm your password'
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
        disabled={isPending || nameIsTaken}
      >
        {isPending ? <Spinner /> : 'Create account'}
      </Button>
    </form>
  );
};

export default SignUpForm;
