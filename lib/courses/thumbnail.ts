import { isR2DocumentSrc, r2DocumentHref } from "@/lib/r2/document-url";
import {
  CATEGORY_FALLBACK_IMAGES,
  type Course,
  type CourseCategory,
} from "@/lib/courses/types";

export function getCourseThumbnailSrc(
  course: Pick<Course, "thumbnail_r2_key" | "thumbnail_url" | "category">,
): string {
  if (course.thumbnail_url) {
    return course.thumbnail_url;
  }
  if (course.thumbnail_r2_key) {
    if (course.thumbnail_r2_key.startsWith("http")) {
      return course.thumbnail_r2_key;
    }
    return r2DocumentHref(course.thumbnail_r2_key);
  }
  return CATEGORY_FALLBACK_IMAGES[course.category];
}

/** Use native <img> for presigned R2 URLs and legacy document proxy paths. */
export function isCourseThumbnailRemoteSrc(src: string): boolean {
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    isR2DocumentSrc(src)
  );
}

export function getCategoryFallbackImage(category: CourseCategory): string {
  return CATEGORY_FALLBACK_IMAGES[category];
}
