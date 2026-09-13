import { z } from 'zod';

const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password length must be at least 8 characters')
  .regex(/[a-z]/, 'Password should contain at least one lowercase letter');

export const signUpSchema = z
  .object({
    name: z
      .string({ error: 'Name is required' })
      .min(3, 'Name must be at least 3 characters')
      .max(50, 'Name must not exceed 50 characters'),
    email: z.email(),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: signUpSchema.shape.email,
  password: passwordSchema,
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
