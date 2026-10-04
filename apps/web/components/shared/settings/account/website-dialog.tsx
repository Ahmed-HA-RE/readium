'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { updateUserProfile } from '@/lib/actions/user/updateUserProfile';
import {
  updateWebsiteSchema,
  type UpdateWebsiteFormData,
} from '@/schema/account';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AccountFieldDialog from './account-field-dialog';

// The input already shows `https://`, so the saved URL is edited without it.
const toInputValue = (website: string | null) =>
  website?.replace(/^https:\/\//i, '') ?? '';

const WebsiteDialog = ({ website }: { website: string | null }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(updateWebsiteSchema),
    defaultValues: { website: toInputValue(website) },
  });

  const handleOpenChange = (next: boolean) => {
    if (next) form.reset({ website: toInputValue(website) });
    setOpen(next);
  };

  const onSubmit = async ({ website }: UpdateWebsiteFormData) => {
    const { error } = await updateUserProfile({ website });

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(
      website ? 'Your website was updated' : 'Your website was removed',
    );
    setOpen(false);
    router.refresh();
  };

  const { isSubmitting, isDirty } = form.formState;

  return (
    <AccountFieldDialog
      title='Website'
      summary='Edit the link shown on your profile.'
      value={toInputValue(website) || 'Add a website'}
      description='Add a link to your site or portfolio. Leave it empty to remove it.'
      open={open}
      onOpenChange={handleOpenChange}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={isSubmitting}
      canSave={isDirty}
    >
      <Controller
        name='website'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor={field.name} className='sr-only'>
              Website
            </FieldLabel>
            <ButtonGroup className='w-full'>
              <ButtonGroupText>https://</ButtonGroupText>
              <Input
                {...field}
                id={field.name}
                type='text'
                inputMode='url'
                autoComplete='url'
                placeholder='example.com'
                aria-invalid={fieldState.invalid}
                disabled={isSubmitting}
                className='h-10'
              />
            </ButtonGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </AccountFieldDialog>
  );
};

export default WebsiteDialog;
