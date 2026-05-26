import { z } from "zod";

/** Student ID format (e.g. REV2026000001). */
export const STUDENT_ID_RE = /^REV\d{10}$/i;

/** Application reference (e.g. REVAPP202600001). */
export const APPLICATION_REF_RE = /^REVAPP\d{9}$/i;

export const portalIdentifierSchema = z
  .string()
  .trim()
  .min(1, "Student ID or application reference is required")
  .max(32)
  .transform((s) => s.toUpperCase())
  .refine(
    (s) => STUDENT_ID_RE.test(s) || APPLICATION_REF_RE.test(s),
    "Enter a valid Student ID or Application Reference",
  );

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const portalLoginSchema = z.object({
  identifier: portalIdentifierSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const passwordResetRequestSchema = z.object({
  identifier: portalIdentifierSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Please enter a valid email address")),
});

export const portalPasswordResetConfirmSchema = z.object({
  token: z.uuid("This reset link is invalid or has expired"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const adminPasswordResetRequestSchema = z.object({
  email: z.email(),
});

export const adminPasswordResetConfirmSchema = z.object({
  token: z.uuid('This reset link is invalid or has expired'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const adminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
