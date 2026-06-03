import {
  presignCourseMediaKey,
} from '@/lib/r2/course-media-urls'
import type { Course } from '@/lib/courses/types'

export async function enrichCourseWithMediaUrls(course: Course): Promise<Course> {
  const [thumbnail_url, instructor_photo_url] = await Promise.all([
    presignCourseMediaKey(course.thumbnail_r2_key),
    presignCourseMediaKey(course.instructor_photo_r2_key),
  ])

  return {
    ...course,
    thumbnail_url,
    instructor_photo_url,
  }
}

export async function enrichCoursesWithMediaUrls(
  courses: Course[],
): Promise<Course[]> {
  return Promise.all(courses.map(enrichCourseWithMediaUrls))
}
