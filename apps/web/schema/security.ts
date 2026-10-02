import { z } from 'zod';
import { passwordSchema } from '@/schema/auth';

// The current password is only checked for presence: it may predate today's password rules.
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: 'Current password is required' })
      .min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from your current one',
    path: ['newPassword'],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
