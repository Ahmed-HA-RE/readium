'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { updateUserProfile } from '@/lib/actions/user/updateUserProfile';
import {
  IMAGE_MIME_TYPES,
  updateImageSchema,
  type UpdateImageFormData,
} from '@/schema/account';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

// No dialog: picking a file is the whole edit, so it uploads as soon as it validates.
const AvatarField = () => {
  const router = useRouter();

  const form = useForm<UpdateImageFormData>({
    resolver: zodResolver(updateImageSchema),
  });

  const onSubmit = async ({ image }: UpdateImageFormData) => {
    if (!image) return;

    const { error } = await updateUserProfile({ image });

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Your avatar was updated');
    form.reset();
    router.refresh();
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    form.setValue('image', file);
    await form.handleSubmit(onSubmit)();
    // Cleared afterwards so picking the same file again still fires `change`.
    input.value = '';
  };

  const { isSubmitting, errors } = form.formState;

  return (
    <Field
      orientation='horizontal'
      align='center'
      className='flex-wrap justify-between gap-x-6 gap-y-3'
    >
      <FieldContent className='gap-1'>
        <FieldLabel htmlFor='image' className='text-base font-normal'>
          Change your avatar
        </FieldLabel>
        <FieldDescription>PNG, JPG, JPEG or AVIF · up to 1MB</FieldDescription>
        {errors.image && <FieldError errors={[errors.image]} />}
      </FieldContent>

      <div className='flex items-center gap-2'>
        {isSubmitting && <Spinner />}
        <Input
          id='image'
          type='file'
          fileSize='large'
          accept={IMAGE_MIME_TYPES.join(',')}
          onChange={handleChange}
          disabled={isSubmitting}
          aria-invalid={!!errors.image}
        />
      </div>
    </Field>
  );
};

export default AvatarField;
