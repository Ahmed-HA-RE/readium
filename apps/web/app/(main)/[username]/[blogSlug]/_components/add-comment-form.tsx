'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { createComment } from '@/lib/actions/comments/createComment';
import {
  createCommentSchema,
  type CreateCommentFormData,
} from '@/schema/comment';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';

const MAX_LENGTH = 500;

type AddCommentFormProps = {
  slug: string;
  viewer: { name: string; image: string | null };
};

const AddCommentForm = ({ slug, viewer }: AddCommentFormProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const fieldId = useId();

  const form = useForm<CreateCommentFormData>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: '' },
  });

  const content = useWatch({ control: form.control, name: 'content' });
  const isPending = form.formState.isSubmitting;

  const onSubmit = async ({ content }: CreateCommentFormData) => {
    try {
      await createComment({ slug, content });
      form.reset();

      // `['comments']` also marks the Library's comments tab stale.
      await queryClient.invalidateQueries({ queryKey: ['comments'] });

      // Only the server-rendered response counts need the refresh.
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not post your response'));
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className='flex flex-col gap-3'
      noValidate
    >
      <div className='flex items-center gap-3'>
        <Avatar>
          <AvatarImage src={viewer.image ?? DEFAULT_AVATAR} alt={viewer.name} />
          <AvatarFallback>{viewer.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className='truncate text-sm font-medium'>{viewer.name}</span>
      </div>

      <Controller
        name='content'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor={fieldId} className='sr-only'>
              Your response
            </FieldLabel>

            <InputGroup>
              <InputGroupTextarea
                {...field}
                id={fieldId}
                placeholder='What are your thoughts?'
                aria-invalid={fieldState.invalid}
                maxLength={MAX_LENGTH}
                disabled={isPending}
                className='min-h-24 resize-none'
              />

              <InputGroupAddon align='block-end'>
                <InputGroupText className='text-xs tabular-nums'>
                  {content.length}/{MAX_LENGTH}
                </InputGroupText>

                <InputGroupButton
                  type='submit'
                  variant='default'
                  size='sm'
                  className='ml-auto rounded-full px-4'
                  disabled={isPending}
                >
                  {isPending && <Spinner className='size-4' />}
                  Respond
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </form>
  );
};

export default AddCommentForm;
