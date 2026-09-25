'use client';

import { useEffect, useId, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { updateComment } from '@/lib/actions/comments/updateComment';
import {
  createCommentSchema,
  type CreateCommentFormData,
} from '@/schema/comment';
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

type EditCommentFormProps = {
  slug: string;
  commentId: string;
  initialContent: string;
  onClose: () => void;
};

const EditCommentForm = ({
  slug,
  commentId,
  initialContent,
  onClose,
}: EditCommentFormProps) => {
  const queryClient = useQueryClient();
  const fieldId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<CreateCommentFormData>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: initialContent },
  });

  const content = useWatch({ control: form.control, name: 'content' });
  const isPending = form.formState.isSubmitting;
  const isUnchanged = content === initialContent;

  // Focus with the caret at the end, ready to keep typing.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  const onUpdateComment = async ({ content }: CreateCommentFormData) => {
    try {
      await updateComment({ slug, commentId, content });

      // The count is unchanged, so unlike create and delete no refresh is needed.
      await queryClient.invalidateQueries({ queryKey: ['comments', slug] });
      onClose();
      toast.success('Comment updated successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the comment'));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onUpdateComment)}>
      <Controller
        name='content'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor={fieldId} className='sr-only'>
              Edit your response
            </FieldLabel>

            <InputGroup>
              <InputGroupTextarea
                {...field}
                ref={(element) => {
                  field.ref(element);
                  textareaRef.current = element;
                }}
                id={fieldId}
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
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='ml-auto rounded-full px-4'
                  disabled={isPending}
                  onClick={onClose}
                >
                  Cancel
                </InputGroupButton>

                <InputGroupButton
                  type='submit'
                  variant='default'
                  size='sm'
                  className='rounded-full px-4'
                  disabled={isUnchanged || isPending}
                >
                  {isPending ? (
                    <>
                      <Spinner className='size-4' />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
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

export default EditCommentForm;
