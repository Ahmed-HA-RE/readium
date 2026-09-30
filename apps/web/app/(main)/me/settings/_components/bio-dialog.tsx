'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { updateUserProfile } from '@/lib/actions/user/updateUserProfile';
import { updateBioSchema, type UpdateBioFormData } from '@/schema/account';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import AccountFieldDialog from './account-field-dialog';

const BIO_MAX_LENGTH = 500;

const BioDialog = ({ bio }: { bio: string | null }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateBioFormData>({
    resolver: zodResolver(updateBioSchema),
    defaultValues: { bio: bio ?? '' },
  });

  const handleOpenChange = (next: boolean) => {
    if (next) form.reset({ bio: bio ?? '' });
    setOpen(next);
  };

  const onSubmit = async ({ bio }: UpdateBioFormData) => {
    const { error } = await updateUserProfile({ bio });

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(bio ? 'Your bio was updated' : 'Your bio was removed');
    setOpen(false);
    router.refresh();
  };

  const { isSubmitting, isDirty } = form.formState;

  return (
    <AccountFieldDialog
      title='Bio'
      summary='Edit the short bio shown on your profile.'
      value={bio || 'Add a bio'}
      description='Tell readers a little about yourself. Leave it empty to remove your bio.'
      open={open}
      onOpenChange={handleOpenChange}
      onSubmit={form.handleSubmit(onSubmit)}
      isPending={isSubmitting}
      canSave={isDirty}
    >
      <Controller
        name='bio'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor={field.name} className='sr-only'>
              Bio
            </FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              rows={5}
              placeholder='Writer, reader, occasional coffee enthusiast...'
              aria-invalid={fieldState.invalid}
              disabled={isSubmitting}
              className='resize-none'
            />
            <FieldDescription className='text-right tabular-nums'>
              {field.value?.length ?? 0}/{BIO_MAX_LENGTH}
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </AccountFieldDialog>
  );
};

export default BioDialog;
