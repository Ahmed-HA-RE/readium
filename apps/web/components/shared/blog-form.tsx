'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LuGlobeLock } from 'react-icons/lu';
import { MyBlogsStatus, type GetBlogBySlugResponse } from '@repo/types';
import {
  ADMIN_MY_STORIES_PATH,
  getBlogPath,
  getErrorMessage,
  getMyStoriesPath,
} from '@/lib/utils';
import { createBlog } from '@/lib/actions/blogs/createBlog';
import { updateBlog } from '@/lib/actions/blogs/updateBlog';
import { blogSchema, type BlogFormData, type BlogValues } from '@/schema/blog';
import BlogEditor from '@/components/shared/blog-editor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

type BlogFormProps = {
  // Builds the public URL a published story redirects to.
  authorName: string;
  // Present when editing; the form starts from it and submits an update.
  blog?: GetBlogBySlugResponse['blog'];
  isAdmin?: boolean;
};

const BlogForm = ({ authorName, blog, isAdmin = false }: BlogFormProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentLabelId = useId();

  const form = useForm<BlogFormData, unknown, BlogValues>({
    resolver: zodResolver(blogSchema),
    mode: 'onSubmit',
    defaultValues: {
      title: blog?.title ?? '',
      shortDescription: blog?.shortDescription ?? '',
      content: blog?.content ?? '',
      tags: blog?.tags.join(', ') ?? '',
      isPublished: blog?.isPublished ?? false,
    },
  });

  const isPending = form.formState.isSubmitting;
  // Drives the draft alert, which follows the toggle before anything is saved.
  const isPublished = useWatch({ control: form.control, name: 'isPublished' });

  const onSubmit = async (values: BlogValues) => {
    try {
      // On update the slug changes with the title, so use the returned one.
      const saved = blog
        ? await updateBlog(blog.slug, values)
        : await createBlog(values);

      await queryClient.invalidateQueries({ queryKey: ['blogs'] });
      if (blog) toast.success('Your story has been updated');

      // A draft lands on the Drafts tab rather than its page, which only the
      // author can see.
      router.push(
        saved.isPublished
          ? getBlogPath(authorName, saved.slug)
          : isAdmin
            ? ADMIN_MY_STORIES_PATH
            : getMyStoriesPath(MyBlogsStatus.DRAFT),
      );
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          blog ? 'Could not update your story' : 'Could not create your story',
        ),
      );
    }
  };

  return (
    <>
      {!isPublished && (
        <Alert
          variant='warning'
          className='sticky top-15 z-40 rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-6 lg:px-8'
        >
          <LuGlobeLock />
          <AlertTitle>Your story is not published</AlertTitle>
          <AlertDescription>
            Only you can see it. Press Publish, then save, to share it with
            readers.
          </AlertDescription>
        </Alert>
      )}

      <div className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8'>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-8'
          noValidate
        >
          <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-12'>
            <h1 className='min-w-0 text-3xl font-bold tracking-tight break-all'>
              {blog ? `Edit: ${blog.title}` : 'Write a story'}
            </h1>

            <Controller
              name='isPublished'
              control={form.control}
              render={({ field }) => (
                <Button
                  type='button'
                  variant={field.value ? 'secondary' : 'default'}
                  onClick={() => field.onChange(!field.value)}
                  disabled={isPending}
                >
                  {field.value ? 'Unpublish' : 'Publish'}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <CoverImageField
              control={form.control}
              currentCover={blog?.coverImage}
              disabled={isPending}
            />

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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
            {blog ? 'Save changes' : 'Create story'}
          </Button>
        </form>
      </div>
    </>
  );
};

export default BlogForm;
