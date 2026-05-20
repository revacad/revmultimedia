import { z } from "zod";
import { isVideoIntroUrl } from "@/lib/courses/curriculum";

export const courseSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  category: z.enum(["graphic_design", "motion_graphics", "video_editing"]),
  description: z.string().optional(),
  mode: z.enum(["online", "in_person", "hybrid"]),
  tuition_fee_ghs: z.number().positive(),
  max_slots: z.number().int().positive(),
  is_published: z.boolean(),
  video_intro_url: z
    .string()
    .nullable()
    .optional()
    .refine((v) => isVideoIntroUrl(v ?? ""), "Intro video must be a YouTube or Vimeo URL"),
});

export const intakeSchema = z.object({
  course_id: z.uuid(),
  name: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  application_deadline: z.string().optional(),
  max_slots: z.number().int().positive().optional(),
});
