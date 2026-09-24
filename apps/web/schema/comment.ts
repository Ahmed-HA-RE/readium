import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string({ error: 'Comment content is required' })
    .min(
      3,
      'Please add at least 3 characters long to share your opinion on the blog',
    )
    .max(500, 'You have reached the maximum length for sharing your comment'),
});

export type CreateCommentFormData = z.infer<typeof createCommentSchema>;

export const DELETE_COMMENT_CONFIRMATION = 'delete permanently';

// Case-sensitive on purpose, like the S3 bucket delete confirmation.
export const deleteCommentSchema = z
  .object({
    confirmation: z.string(),
  })
  .refine((value) => value.confirmation === DELETE_COMMENT_CONFIRMATION, {
    message: `Type "${DELETE_COMMENT_CONFIRMATION}" exactly to confirm`,
    path: ['confirmation'],
  });

export type DeleteCommentFormData = z.infer<typeof deleteCommentSchema>;
