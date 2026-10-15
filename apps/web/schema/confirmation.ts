import { z } from 'zod';

export const DELETE_CONFIRMATION = 'delete permanently';

// Case-sensitive on purpose, like the S3 bucket delete confirmation.
export const confirmDeleteSchema = z
  .object({
    confirmation: z.string(),
  })
  .refine((value) => value.confirmation === DELETE_CONFIRMATION, {
    message: `Type "${DELETE_CONFIRMATION}" exactly to confirm`,
    path: ['confirmation'],
  });

export type ConfirmDeleteFormData = z.infer<typeof confirmDeleteSchema>;
