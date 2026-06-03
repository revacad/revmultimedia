import type { Course } from "@/lib/courses/types";

/** TEMP: hardcoded preview card — remove when DB has courses */
export const PREVIEW_GRAPHIC_DESIGN_COURSE: Course = {
  id: "preview-graphic-design",
  title: "Graphic Design",
  slug: "graphic-design",
  category: "design",
  mode: "in_person",
  description:
    "Master visual communication. Typography, layout, brand systems, and digital design built on principles that outlast any software update.",
  curriculum: null,
  video_intro_url: null,
  tuition_fee_ghs: 2500,
  max_slots: 20,
  is_published: true,
  thumbnail_r2_key: null,
  instructor_name: null,
  instructor_title: null,
  instructor_bio: null,
  instructor_photo_r2_key: null,
  intakes: [
    {
      id: "preview-intake-1",
      course_id: "preview-graphic-design",
      name: "Upcoming cohort",
      start_date: "2026-06-01",
      end_date: "2026-09-01",
      application_deadline: null,
      max_slots: 20,
      enrolled_count: 8,
      is_closed: false,
    },
  ],
};

/** TEMP: shown when no courses are in DB yet (development only). */
export function withPreviewCourses(courses: Course[]): Course[] {
  if (process.env.NODE_ENV === 'production' || courses.length > 0) {
    return courses;
  }
  return [PREVIEW_GRAPHIC_DESIGN_COURSE];
}

export function getCourseForCategory(
  courses: Course[],
  category: Course["category"],
): Course | undefined {
  return courses.find((c) => c.category === category);
}
