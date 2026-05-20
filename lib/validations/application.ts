import { z } from "zod";

const uploadedFileSchema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.coerce.number().int().positive(),
  mimeType: z.string().min(1),
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
  idempotencyKey: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(["male", "female", "prefer_not_to_say"]),
  country: z.string().min(1),
  address: z.string().min(1),
  stateRegion: z.string().optional(),
  city: z.string().optional(),
  qualification: z.enum(["wassce", "hnd", "degree", "masters", "other"]),
  institution: z.string().min(1),
  yearCompleted: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear()),
  priorExperience: z.string().optional(),
  courseId: z.string().min(1),
  intakeId: z.string().min(1),
  hybridAttendanceConfirmed: z.boolean().default(false),
  password: z.string().min(8),
  documents: z.object({
    idDocument: uploadedFileSchema,
    passportPhoto: uploadedFileSchema,
    certificates: z.array(uploadedFileSchema).max(3).optional(),
  }),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
