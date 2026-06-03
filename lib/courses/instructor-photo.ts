import { r2DocumentHref } from '@/lib/r2/document-url'
import type { Course } from '@/lib/courses/types'

export function getInstructorPhotoSrc(
  course: Pick<Course, 'instructor_photo_r2_key' | 'instructor_photo_url'>,
): string | null {
  if (course.instructor_photo_url) {
    return course.instructor_photo_url
  }
  const key = course.instructor_photo_r2_key
  if (!key) return null
  if (key.startsWith('http')) return key
  return r2DocumentHref(key)
}
