import { z } from 'zod';

export const COVER_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

export const COVER_IMAGE_MAX_SIZE = 5_000_000; // 5MB, in bytes

const fileSchema = z.file({ error: 'Cover image must be a file' });

// Shared by create and edit. An omitted `coverImage` on edit keeps the current one.
export const blogSchema = z.object({
  title: z
    .string()
    .nonempty({ error: 'Blog title is required' })
    .min(5, 'Blog title must be at least 5 characters long')
    .max(100, 'Blog title must not exceed 100 characters long'),

  shortDescription: z
    .string()
    .nonempty({ error: 'Blog short description is required' })
    .min(10, 'Blog short description must be at least 10 characters long')
    .max(200, 'Blog short description must not exceed 200 characters long'),

  content: z
    .string()
    .nonempty({ error: 'Please provide some content to the readers' })
    .min(20, 'Blog content must be at least 20 characters long'),

  coverImage: fileSchema
    .mime(
      COVER_IMAGE_MIME_TYPES,
      'Cover image must be a JPEG, PNG or WEBP file',
    )
    .max(COVER_IMAGE_MAX_SIZE, 'Cover image must not exceed 5MB')
    .optional(),

  // Empty entries and duplicates are dropped, since the API rejects both.
  tags: z
    .string()
    .nonempty({ error: 'Please add at least one tag' })
    .transform((value) => [
      ...new Set(
        value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(
      z
        .string()
        .array()
        .min(1, 'Please add at least one tag')
        .refine(
          (tags) => tags.every((tag) => tag.length >= 2),
          'Each tag must be at least 2 characters long',
        )
        .refine(
          (tags) => tags.every((tag) => tag.length <= 50),
          'Each tag must not exceed 50 characters long',
        ),
    ),

  isPublished: z
    .boolean({ error: 'Please choose the publish status' })
    .optional(),
});

// Fields hold the input shape; `onSubmit` receives the output, where `tags` is an array.
export type BlogFormData = z.input<typeof blogSchema>;
export type BlogValues = z.output<typeof blogSchema>;

// The confirmation is the blog's own title, so the schema is built per blog.
export const createDeleteBlogSchema = (title: string) =>
  z
    .object({
      confirmation: z.string(),
    })
    .refine((value) => value.confirmation === title, {
      message: 'Type the story title exactly to confirm',
      path: ['confirmation'],
    });

export type DeleteBlogFormData = z.infer<
  ReturnType<typeof createDeleteBlogSchema>
>;
