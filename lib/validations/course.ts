import { z } from "zod";
import { isVideoIntroUrl } from "@/lib/courses/curriculum";

export const courseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens"),
  category: z.enum(["graphic_design", "motion_graphics", "video_editing"]),
  description: z
    .string()
    .trim()
    .max(5000, "Description is too long")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  mode: z.enum(["online", "in_person", "hybrid"]),
  tuition_fee_ghs: z.coerce
    .number()
    .positive("Tuition must be greater than zero")
    .max(10_000_000, "Tuition amount is too large"),
  max_slots: z.coerce
    .number()
    .int()
    .positive("Max slots must be at least 1")
    .max(10_000, "Max slots is too large"),
  is_published: z.boolean(),
  video_intro_url: z
    .string()
    .nullable()
    .optional()
    .refine((v) => isVideoIntroUrl(v ?? ""), "Intro video must be a YouTube or Vimeo URL"),
});

export const intakeSchema = z.object({
  course_id: z.uuid("Invalid course id"),
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  start_date: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid start date"),
  end_date: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid end date"),
  application_deadline: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v == null || !Number.isNaN(Date.parse(v)), "Invalid application deadline"),
  max_slots: z.coerce
    .number()
    .int()
    .positive()
    .max(10_000)
    .optional(),
});

export const coursePublishSchema = z.object({
  id: z.uuid("Invalid course id"),
  publish: z.boolean(),
});
