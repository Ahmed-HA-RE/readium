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

// Better Auth asks for the password before enabling or disabling 2FA.
export const confirmPasswordSchema = z.object({
  password: changePasswordSchema.shape.currentPassword,
});

export const otpCodeSchema = z.object({
  code: z.string().min(6, 'Enter the 6-character code'),
});

// The `/2fa` sign-in step; `trustDevice` skips 2FA on this browser for 30 days.
export const verifyTwoFactorSchema = otpCodeSchema.extend({
  trustDevice: z.boolean(),
});

export type ConfirmPasswordValues = z.infer<typeof confirmPasswordSchema>;
export type VerifyTwoFactorValues = z.infer<typeof verifyTwoFactorSchema>;
export type OtpCodeValues = z.infer<typeof otpCodeSchema>;
