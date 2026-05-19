import { z } from "zod";

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
  year_completed: z.number().int().positive(),
  prior_experience: z.string().optional(),
  course_id: z.uuid(),
  intake_id: z.uuid(),
  hybrid_attendance_confirmed: z.boolean().default(false),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
