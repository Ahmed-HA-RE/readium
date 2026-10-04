'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import {
  confirmPasswordSchema,
  type ConfirmPasswordValues,
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

// Also removes the backup codes and every trusted device, so the next sign-in asks for the password only.
const DisableTwoFactorDialog = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<ConfirmPasswordValues>({
    resolver: zodResolver(confirmPasswordSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async ({ password }: ConfirmPasswordValues) => {
    await authClient.twoFactor.disable(
      { password },
      {
        onSuccess: () => {
          toast.success('Two-factor authentication is off');
          setOpen(false);
          router.refresh();
        },
        onError: ({ error }) => {
          toast.error(error.message);
        },
      },
    );
  };

  const isPending = form.formState.isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) form.reset();
      }}
    >
      <DialogTrigger
        render={<Button variant='destructive-outline' shape='pill' />}
      >
        Disable
      </DialogTrigger>

      <DialogContent className='gap-6 p-6 sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>
            Turn off two-factor authentication?
          </DialogTitle>
          <DialogDescription>
            Signing in will only need your password again, and your backup codes
            stop working. Enter your password to confirm.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className='grid gap-6'
        >
          <Controller
            name='password'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor='disable-2fa-password'>Password</FieldLabel>
                <Input
                  {...field}
                  id='disable-2fa-password'
                  type='password'
                  autoComplete='current-password'
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
          <DialogFooter>
            <DialogClose
              render={<Button variant='outline' shape='pill' />}
              disabled={isPending}
            >
              Cancel
            </DialogClose>
            <Button
              type='submit'
              variant='destructive'
              shape='pill'
              disabled={isPending}
            >
              {isPending ? <Spinner /> : 'Turn off'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DisableTwoFactorDialog;
