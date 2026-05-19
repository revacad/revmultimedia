import type { CourseCategory, CourseMode } from "@/lib/courses/types";

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  graphic_design: "Graphic Design",
  motion_graphics: "Motion Graphics",
  video_editing: "Video Editing",
};

export const MODE_LABELS: Record<CourseMode, string> = {
  online: "Online",
  in_person: "In-Person",
  hybrid: "Hybrid",
};

export function formatCategory(category: CourseCategory): string {
  return CATEGORY_LABELS[category];
}

export function formatMode(mode: CourseMode): string {
  return MODE_LABELS[mode];
}
