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
