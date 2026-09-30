'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounce } from 'use-debounce';
import { FaCheck, FaXmark } from 'react-icons/fa6';
import { toast } from 'sonner';
import { useIsUsernameTaken } from '@/hooks/user';
import { updateUserProfile } from '@/lib/actions/user/updateUserProfile';
import { updateNameSchema, type UpdateNameFormData } from '@/schema/account';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import AccountFieldDialog from './account-field-dialog';

const NameDialog = ({ name }: { name: string }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateNameFormData>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name },
  });

  const value = useWatch({ control: form.control, name: 'name' });
  const [debouncedValue] = useDebounce(value, 400);
  const { data: nameIsTaken, isFetching: isCheckingName } =
    useIsUsernameTaken(debouncedValue);

  // The check is case-insensitive, so it reports the user's own name as taken.
  const isOwnName = value.trim().toLowerCase() === name.toLowerCase();
  const isTaken = !isOwnName && nameIsTaken === true;
  const isAvailable =
    isOwnName ||
    (debouncedValue === value && !isCheckingName && nameIsTaken === false);

  const handleOpenChange = (next: boolean) => {
    if (next) form.reset({ name });
    setOpen(next);
  };

  const onSubmit = async ({ name }: UpdateNameFormData) => {
    const { error } = await updateUserProfile({ name });

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Your name was updated');
    setOpen(false);
    router.refresh();
  };

  const { isSubmitting, isDirty } = form.formState;

  return (
    <AccountFieldDialog
      title='Name'
      summary='Edit the name shown on your profile and stories.'
      value={`@${name}`}
      description='Your name is also your username, so your profile link changes with it.'
      open={open}
      onOpenChange={handleOpenChange}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={isSubmitting}
      canSave={isDirty && isAvailable}
    >
      <Controller
        name='name'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor={field.name} className='sr-only'>
              Name
            </FieldLabel>
            <InputGroup className='h-10'>
              <InputGroupInput
                {...field}
                id={field.name}
                autoComplete='name'
                placeholder='Enter your name'
                aria-invalid={fieldState.invalid || isTaken}
                disabled={isSubmitting}
              />
              {!fieldState.invalid && !isOwnName && (
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
              isTaken && (
                <FieldError
                  errors={[{ message: 'That name is already taken' }]}
                />
              )
            )}
          </Field>
        )}
      />
    </AccountFieldDialog>
  );
};

export default NameDialog;
