import { getPublicUrl } from "@/lib/r2/presign";
import {
  CATEGORY_FALLBACK_IMAGES,
  type Course,
  type CourseCategory,
} from "@/lib/courses/types";

export function getCourseThumbnailSrc(
  course: Pick<Course, "thumbnail_r2_key" | "category">,
): string {
  if (course.thumbnail_r2_key) {
    if (course.thumbnail_r2_key.startsWith("http")) {
      return course.thumbnail_r2_key;
    }
    try {
      return getPublicUrl(course.thumbnail_r2_key);
    } catch {
      return CATEGORY_FALLBACK_IMAGES[course.category];
    }
  }
  return CATEGORY_FALLBACK_IMAGES[course.category];
}

export function getCategoryFallbackImage(category: CourseCategory): string {
  return CATEGORY_FALLBACK_IMAGES[category];
}
