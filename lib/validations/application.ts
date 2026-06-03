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

export const applicationChannelSchema = z.enum(['standard', 'level_up'])

export const submitApplicationSchema = z.object({
  applicationChannel: applicationChannelSchema.default('standard'),
  _hp: z.string().max(500).optional(),
  /** @deprecated Legacy honeypot name; ignore if _hp is empty */
  fax: z.string().max(500).optional(),
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
    .max(200, "Institution name is too long")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  yearCompleted: z.coerce.number().int().min(1990).max(2100),
  priorExperience: z
    .string()
    .trim()
    .max(2000, "Experience text is too long")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  courseId: z.uuid("Invalid course"),
  intakeId: z.uuid("Invalid intake"),
  hybridAttendanceConfirmed: z.boolean().default(false),
  password: z.string().max(128).optional(),
  documents: z.object({
    idDocument: uploadedFileSchema,
    passportPhoto: uploadedFileSchema,
    certificates: z.array(uploadedFileSchema).max(3).optional(),
  }),
  parentGuardianWhatsapp: z.string().trim().max(32).optional(),
  parentGuardianEmail: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .refine((v) => !v || z.email().safeParse(v).success, 'Invalid parent email'),
  shsSchoolId: z
    .union([z.string().uuid(), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  shsSchoolNameFreeform: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  parentContactConsent: z.coerce.boolean().optional(),
}).superRefine((data, ctx) => {
  const currentYear = new Date().getFullYear()

  if (!data.password || data.password.length < 8) {
    ctx.addIssue({
      code: 'custom',
      message: 'Password must be at least 8 characters',
      path: ['password'],
    })
  }

  if (data.applicationChannel !== 'level_up') {
    if (!data.institution?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Institution is required',
        path: ['institution'],
      })
    }
    if (data.yearCompleted > currentYear) {
      ctx.addIssue({
        code: 'custom',
        message: `Year completed cannot be after ${currentYear}`,
        path: ['yearCompleted'],
      })
    }
    return
  }

  if (!data.parentGuardianWhatsapp?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Parent/guardian WhatsApp is required',
      path: ['parentGuardianWhatsapp'],
    })
  }
  if (!data.shsSchoolId && !data.shsSchoolNameFreeform?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Select your senior high school or enter it manually',
      path: ['shsSchoolId'],
    })
  }
  const institution =
    data.institution?.trim() || data.shsSchoolNameFreeform?.trim() || ''
  if (!institution) {
    ctx.addIssue({
      code: 'custom',
      message: 'Enter your senior high school',
      path: ['shsSchoolId'],
    })
  }
  if (data.yearCompleted > currentYear + 2) {
    ctx.addIssue({
      code: 'custom',
      message: `Enter a year between 1990 and ${currentYear + 2}`,
      path: ['yearCompleted'],
    })
  }
  if (!data.parentContactConsent) {
    ctx.addIssue({
      code: 'custom',
      message: 'Confirm that the parent/guardian agrees to be contacted',
      path: ['parentContactConsent'],
    })
  }
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
