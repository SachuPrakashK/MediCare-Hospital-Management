import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({ email: z.email(), password: z.string().min(8).max(128) }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
export const guestRegistrationSchema = z.object({
  body: z
    .object({
      first_name: z.string().trim().min(1).max(80),
      last_name: z.string().trim().min(1).max(80),
      email: z
        .string()
        .trim()
        .email()
        .transform((email) => email.toLowerCase()),
      password: z.string().min(12).max(128),
      confirmation: z.string().min(12).max(128),
    })
    .refine((value) => value.password === value.confirmation, {
      path: ['confirmation'],
      message: 'Passwords do not match.',
    }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
export const refreshSchema = z.object({
  body: z.object({ refresh_token: z.string().min(20) }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
const shell = <T extends z.ZodType>(body: T) =>
  z.object({ body, query: z.object({}).passthrough(), params: z.object({}).passthrough() });
export const forgotPasswordSchema = shell(z.object({ email: z.email() }));
export const resetPasswordSchema = shell(
  z.object({ token: z.string().min(32), password: z.string().min(12).max(128) }),
);
export const changePasswordSchema = shell(
  z.object({
    current_password: z.string().min(8).max(128),
    new_password: z.string().min(12).max(128),
  }),
);
