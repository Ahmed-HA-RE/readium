import { z } from 'zod';

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/avif',
];

export const IMAGE_MAX_SIZE = 1_000_000; // 1MB, in bytes

const imageFileSchema = z.file();

const hasProtocol = (url: string) => /^https?:\/\//i.test(url);

const updateAccountBaseSchema = z.object({
  email: z.email({ error: 'Enter a valid email' }),
  name: z
    .string()
    .trim()
    .nonempty({ error: 'Name must not be empty' })
    .min(3, 'Your name must be at least 3 characters long')
    .max(50, 'Your name must be at most 50 characters long'),
  image: imageFileSchema
    .max(IMAGE_MAX_SIZE, 'Image must not exceed 1MB')
    .mime(IMAGE_MIME_TYPES, 'Image must be a PNG, JPG, JPEG or AVIF file')
    .optional(),

  bio: z
    .string()
    .trim()
    .max(500, 'Your bio must not exceed 500 characters long')
    .refine(
      (bio) => bio === '' || bio.length >= 10,
      'Your bio must be at least 10 characters long',
    )
    .optional(),
  website: z
    .string()
    .trim()
    .transform((url) => (url && !hasProtocol(url) ? `https://${url}` : url))
    .refine(
      (url) => url === '' || z.httpUrl().safeParse(url).success,
      'Enter a valid website, like example.com',
    )
    .optional(),
});

export const updateEmailSchema = updateAccountBaseSchema.pick({ email: true });
export type UpdateEmailFormData = z.infer<typeof updateEmailSchema>;

export const updateNameSchema = updateAccountBaseSchema.pick({ name: true });
export type UpdateNameFormData = z.infer<typeof updateNameSchema>;

export const updateBioSchema = updateAccountBaseSchema.pick({ bio: true });
export type UpdateBioFormData = z.infer<typeof updateBioSchema>;

export const updateWebsiteSchema = updateAccountBaseSchema.pick({
  website: true,
});
export type UpdateWebsiteFormData = z.infer<typeof updateWebsiteSchema>;

export const updateImageSchema = updateAccountBaseSchema.pick({ image: true });
export type UpdateImageFormData = z.infer<typeof updateImageSchema>;
