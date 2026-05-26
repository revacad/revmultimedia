import { z } from "zod";
import { APPLICATION_STATUSES } from "@/lib/applications/types";

const uploadedFileSchema = z.object({
  key: z.string().trim().min(1).max(512),
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024, "File is too large"),
  mimeType: z.string().trim().min(1).max(100),
});

export const applicationSchema = z.object({
  real_email: z.email(),
  phone: z.string().min(1),
  full_name: z.string().min(1),
  date_of_birth: z.string().min(1),
  gender: z.enum(["male", "female", "prefer_not_to_say"]),
  country: z.string().min(1),
  address: z.string().min(1),
  state_region: z.string().optional(),
  city: z.string().optional(),
  qualification: z.enum(["wassce", "hnd", "degree", "masters", "other"]),
  institution: z.string().min(1),
  year_completed: z.coerce.number().int().min(1990).max(new Date().getFullYear()),
  prior_experience: z.string().optional(),
  course_id: z.uuid(),
  intake_id: z.uuid(),
  hybrid_attendance_confirmed: z.boolean().default(false),
});

export const submitApplicationSchema = z.object({
  website: z.string().max(500).optional(),
  idempotencyKey: z.string().trim().min(1).max(128),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .email("Please enter a valid email address"),
  fullName: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  phone: z.string().trim().min(5, "Phone number is required").max(32, "Phone number is too long"),
  dateOfBirth: z
    .string()
    .trim()
    .min(1, "Date of birth is required")
    .max(32)
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date of birth"),
  gender: z.enum(["male", "female", "prefer_not_to_say"]),
  country: z.string().trim().min(1, "Country is required").max(80),
  address: z.string().trim().min(1, "Address is required").max(500, "Address is too long"),
  stateRegion: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  city: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  qualification: z.enum(["wassce", "hnd", "degree", "masters", "other"]),
  institution: z
    .string()
    .trim()
    .min(1, "Institution is required")
    .max(200, "Institution name is too long"),
  yearCompleted: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear()),
  priorExperience: z
    .string()
    .trim()
    .max(2000, "Experience text is too long")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  courseId: z.uuid("Invalid course"),
  intakeId: z.uuid("Invalid intake"),
  hybridAttendanceConfirmed: z.boolean().default(false),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  documents: z.object({
    idDocument: uploadedFileSchema,
    passportPhoto: uploadedFileSchema,
    certificates: z.array(uploadedFileSchema).max(3).optional(),
  }),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.uuid("Invalid application id"),
  status: z.enum(APPLICATION_STATUSES, { message: "Invalid status" }),
});

export const addAdminNoteSchema = z.object({
  applicationId: z.uuid("Invalid application id"),
  note: z
    .string()
    .trim()
    .min(1, "Note cannot be empty")
    .max(2000, "Note is too long"),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
