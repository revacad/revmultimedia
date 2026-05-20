export type CourseCategory = "graphic_design" | "motion_graphics" | "video_editing";
export type CourseMode = "online" | "in_person" | "hybrid";

export interface Intake {
  id: string;
  course_id: string;
  name: string;
  start_date: string;
  end_date: string;
  application_deadline: string | null;
  max_slots: number | null;
  enrolled_count: number;
  is_closed: boolean;
}

export type CourseCurriculum = {
  html?: string;
  version?: number;
  outline?: string;
  sections?: string[];
};

export interface Course {
  id: string;
  title: string;
  slug: string;
  category: CourseCategory;
  description: string | null;
  curriculum: CourseCurriculum | null;
  video_intro_url: string | null;
  mode: CourseMode;
  tuition_fee_ghs: number;
  max_slots: number;
  is_published: boolean;
  thumbnail_r2_key: string | null;
  created_at?: string;
  updated_at?: string;
  intakes: Intake[];
}

export const CATEGORY_FALLBACK_IMAGES: Record<CourseCategory, string> = {
  graphic_design: "/images/color-scheme.jpg",
  motion_graphics: "/images/digital-pen.jpg",
  video_editing: "/images/timeline.jpg",
};
