import * as z from 'zod';

export const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s'-]+$/, 'Only letters, spaces, hyphens and apostrophes allowed'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s'-]+$/, 'Only letters, spaces, hyphens and apostrophes allowed'),
  phone: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      'Please enter a valid phone number'
    )
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  timezone: z.string(),
  language: z.string(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
