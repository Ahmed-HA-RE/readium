'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import { FiCopy, FiDownload } from 'react-icons/fi';
import { authClient } from '@/lib/auth-client';
import { copyToClipboard } from '@/lib/utils';
import { SITE_NAME } from '@/lib/constants';
import {
  confirmPasswordSchema,
  otpCodeSchema,
  type ConfirmPasswordValues,
  type OtpCodeValues,
} from '@/schema/security';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import OtpInput from '@/components/shared/otp-input';

type Setup = { totpURI: string; backupCodes: string[] };

const AUTHENTICATOR_APPS = [
  {
    name: 'Google Authenticator',
    href: 'https://support.google.com/accounts/answer/1066447',
  },
  {
    name: 'Microsoft Authenticator',
    href: 'https://www.microsoft.com/en-us/security/mobile-authenticator-app',
  },
  { name: 'Authy', href: 'https://www.authy.com/' },
];

const StepNumber = ({ children }: { children: React.ReactNode }) => (
  <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/80 font-medium'>
    {children}
  </span>
);

// Better Auth hands out the QR code only after the password, and turns 2FA on only after the first code.
const TwoFactorDialog = () => {
  const router = useRouter();
  const codeLabelId = useId();
  const [open, setOpen] = useState(false);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [isActivated, setIsActivated] = useState(false);

  const passwordForm = useForm<ConfirmPasswordValues>({
    resolver: zodResolver(confirmPasswordSchema),
    defaultValues: { password: '' },
  });

  const codeForm = useForm<OtpCodeValues>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: { code: '' },
  });

  const handleOpenChangeComplete = (isOpen: boolean) => {
    if (isOpen) return;
    // Refreshing only now keeps the backup codes on screen until the user closes the dialog.
    if (isActivated) router.refresh();
    setSetup(null);
    setIsActivated(false);
    passwordForm.reset();
    codeForm.reset();
  };

  const onConfirmPassword = async ({ password }: ConfirmPasswordValues) => {
    await authClient.twoFactor.enable(
      { password },
      {
        onSuccess: ({ data }) => {
          setSetup(data as Setup);
        },
        onError: ({ error }) => {
          toast.error(error.message);
        },
      },
    );
  };

  const onActivate = async ({ code }: OtpCodeValues) => {
    await authClient.twoFactor.verifyTotp(
      { code },
      {
        onSuccess: () => {
          setIsActivated(true);
          toast.success('Two-factor authentication is on');
        },
        onError: ({ error }) => {
          codeForm.reset();
          toast.error(error.message);
        },
      },
    );
  };

  const downloadBackupCodes = (codes: string[]) => {
    const heading = `${SITE_NAME} backup codes`.toUpperCase();
    const file = new Blob(
      [
        `${heading}\n\n${codes.join('\n')}\n\nEach code works once. Keep them somewhere safe.\n`,
      ],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(file);
    const link = Object.assign(document.createElement('a'), {
      href: url,
      download: `${SITE_NAME.toLowerCase()}-backup-codes.txt`,
    });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <DialogTrigger render={<Button shape='pill' />}>Enable</DialogTrigger>

      <DialogContent className='gap-6 p-4 lg:p-6 sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl'>
            Two-factor authentication
          </DialogTitle>
          <DialogDescription>
            {!setup
              ? 'Enter your password to start setting up your authenticator app.'
              : isActivated
                ? "Save these backup codes somewhere safe. Each one works once, if you ever lose your phone and can't reach your email."
                : null}
          </DialogDescription>
        </DialogHeader>

        {!setup && (
          <form
            onSubmit={passwordForm.handleSubmit(onConfirmPassword)}
            noValidate
            className='grid gap-6'
          >
            <Controller
              name='password'
              control={passwordForm.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type='password'
                    autoComplete='current-password'
                    aria-invalid={fieldState.invalid}
                    disabled={passwordForm.formState.isSubmitting}
                    large={true}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <DialogFooter>
              <DialogClose render={<Button variant='outline' shape='pill' />}>
                Cancel
              </DialogClose>
              <Button
                type='submit'
                shape='pill'
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? <Spinner /> : 'Continue'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {setup && !isActivated && (
          <form
            onSubmit={codeForm.handleSubmit(onActivate)}
            noValidate
            className='grid gap-6'
          >
            {/* White behind the code so it scans in dark mode too. */}
            <div className='mx-auto rounded-lg bg-white p-3'>
              <QRCode value={setup.totpURI} size={140} />
            </div>

            <div className='flex gap-4'>
              <StepNumber>1</StepNumber>
              <div className='grid min-w-0 gap-3 text-sm'>
                <p>
                  Scan the QR code with an authenticator app on your phone (e.g.{' '}
                  {AUTHENTICATOR_APPS.map(({ name, href }, index) => (
                    <span key={name}>
                      <a
                        href={href}
                        target='_blank'
                        rel='noreferrer'
                        className='text-sky-500 underline-offset-4 hover:underline'
                      >
                        {name}
                      </a>
                      {index < AUTHENTICATOR_APPS.length - 1 && ', '}
                    </span>
                  ))}
                  ).
                </p>
              </div>
            </div>

            <div className='flex gap-4'>
              <StepNumber>2</StepNumber>
              <div className='grid gap-3 text-sm w-full'>
                <p id={codeLabelId}>Enter the 6-digit code shown in the app:</p>
                <Controller
                  name='code'
                  control={codeForm.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <OtpInput
                        aria-labelledby={codeLabelId}
                        value={field.value}
                        onChange={field.onChange}
                        invalid={fieldState.invalid}
                        disabled={codeForm.formState.isSubmitting}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant='outline' shape='pill' />}>
                Cancel
              </DialogClose>
              <Button
                type='submit'
                shape='pill'
                disabled={codeForm.formState.isSubmitting}
              >
                {codeForm.formState.isSubmitting ? (
                  <>
                    <Spinner /> Activating...
                  </>
                ) : (
                  'Activate'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {setup && isActivated && (
          <div className='grid gap-6'>
            <ul className='grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-4 font-mono text-sm sm:grid-cols-3'>
              {setup.backupCodes.map((code) => (
                <li key={code} className='text-center tracking-wider'>
                  {code}
                </li>
              ))}
            </ul>

            <DialogFooter className='sm:justify-between'>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  shape='pill'
                  onClick={() =>
                    void copyToClipboard(
                      setup.backupCodes.join('\n'),
                      'Backup codes copied',
                    )
                  }
                >
                  <FiCopy />
                  Copy
                </Button>
                <Button
                  variant='outline'
                  shape='pill'
                  onClick={() => downloadBackupCodes(setup.backupCodes)}
                >
                  <FiDownload />
                  Download
                </Button>
              </div>
              <DialogClose render={<Button shape='pill' />}>Done</DialogClose>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorDialog;
