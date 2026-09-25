'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { createBlog } from '@/lib/actions/blogs/createBlog';
import {
  createBlogSchema,
  type CreateBlogFormData,
  type CreateBlogValues,
} from '@/schema/blog';
import BlogEditor from '@/components/shared/blog-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import CoverImageField from './cover-image-field';

const RequiredMark = () => (
  <span aria-hidden className='text-destructive'>
    *
  </span>
);

const CreateBlogForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentLabelId = useId();

  const form = useForm<CreateBlogFormData, unknown, CreateBlogValues>({
    resolver: zodResolver(createBlogSchema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      shortDescription: '',
      content: '',
      tags: '',
      isPublished: false,
    },
  });

  const isPending = form.formState.isSubmitting;

  const onSubmit = async (values: CreateBlogValues) => {
    try {
      const blog = await createBlog(values);
      await queryClient.invalidateQueries({ queryKey: ['blogs'] });
      router.push(`/me/stories/${encodeURIComponent(blog.slug)}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create your story'));
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className='flex flex-col gap-8'
      noValidate
    >
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-3xl font-bold tracking-tight'>Write a story</h1>

        <Controller
          name='isPublished'
          control={form.control}
          render={({ field }) => (
            <Button
              type='button'
              variant={field.value ? 'default' : 'secondary'}
              onClick={() => field.onChange(!field.value)}
              disabled={isPending}
            >
              <span className='sr-only'>Publish status: </span>
              {field.value ? 'Published' : 'Unpublished'}
            </Button>
          )}
        />
      </div>

      <FieldGroup>
        <Controller
          name='title'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Title <RequiredMark />
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder='Give your story a title'
                aria-invalid={fieldState.invalid}
                aria-required
                disabled={isPending}
                className='h-10'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='shortDescription'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Short description <RequiredMark />
              </FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                placeholder='What is your story about?'
                aria-invalid={fieldState.invalid}
                aria-required
                disabled={isPending}
                className='min-h-24 resize-none'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <CoverImageField control={form.control} disabled={isPending} />

        <Controller
          name='tags'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor={field.name}>
                Tags <RequiredMark />
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder='travel, productivity, react'
                aria-invalid={fieldState.invalid}
                aria-required
                aria-describedby={`${field.name}-description`}
                disabled={isPending}
                className='h-10'
              />
              <FieldDescription id={`${field.name}-description`}>
                Separate multiple tags with commas.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='content'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel id={contentLabelId}>
                Content <RequiredMark />
              </FieldLabel>
              <BlogEditor
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                labelId={contentLabelId}
                invalid={fieldState.invalid}
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        type='submit'
        size='lg'
        disabled={isPending}
        className='self-end'
      >
        {isPending && <Spinner className='size-4' />}
        Create story
      </Button>
    </form>
  );
};

export default CreateBlogForm;
