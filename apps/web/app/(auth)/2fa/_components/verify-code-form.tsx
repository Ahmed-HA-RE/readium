'use client';

import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { ADMIN_OVERVIEW_PATH } from '@/lib/routes';
import {
  verifyTwoFactorSchema,
  type VerifyTwoFactorValues,
} from '@/schema/security';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import OtpInput from '@/components/shared/otp-input';

// `totp` is the authenticator app, `otp` the emailed code.
export type TwoFactorMethod = 'totp' | 'otp' | 'backup';

// A switch, because the three methods have signatures TypeScript can't call through one union.
const verifyCode = (
  method: TwoFactorMethod,
  body: { code: string; trustDevice: boolean },
) => {
  switch (method) {
    case 'totp':
      return authClient.twoFactor.verifyTotp(body);
    case 'otp':
      return authClient.twoFactor.verifyOtp(body);
    case 'backup':
      return authClient.twoFactor.verifyBackupCode(body);
  }
};

type VerifyCodeFormProps = {
  method: TwoFactorMethod;
  label: string;
  // Relative and already validated by the page.
  callbackUrl: string;
};

const VerifyCodeForm = ({ method, label, callbackUrl }: VerifyCodeFormProps) => {
  const labelId = useId();
  const trustId = useId();

  const form = useForm<VerifyTwoFactorValues>({
    resolver: zodResolver(verifyTwoFactorSchema),
    defaultValues: { code: '', trustDevice: false },
  });

  // A full load, so every server component reads the session Better Auth just created.
  const onSubmit = async ({ code, trustDevice }: VerifyTwoFactorValues) => {
    const { data, error } = await verifyCode(method, { code, trustDevice });

    if (error) {
      form.resetField('code');
      toast.error(error.message ?? 'That code did not work');
      return;
    }

    window.location.assign(
      data.user.role === 'admin' ? ADMIN_OVERVIEW_PATH : callbackUrl,
    );
  };

  const isPending = form.formState.isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className='flex flex-col gap-6'
    >
      <Controller
        name='code'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field className='gap-4'>
            <FieldLabel id={labelId}>{label}</FieldLabel>
            <OtpInput
              aria-labelledby={labelId}
              value={field.value}
              onChange={field.onChange}
              allowLetters={method === 'backup'}
              invalid={fieldState.invalid}
              disabled={isPending}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name='trustDevice'
        control={form.control}
        render={({ field }) => (
          <Field orientation='horizontal'>
            <Checkbox
              id={trustId}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isPending}
            />
            <FieldLabel htmlFor={trustId} className='font-normal'>
              Remember this device
            </FieldLabel>
          </Field>
        )}
      />

      <Button type='submit' size='lg' className='w-full' disabled={isPending}>
        {isPending ? <Spinner /> : 'Verify'}
      </Button>
    </form>
  );
};

export default VerifyCodeForm;
