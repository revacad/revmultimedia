import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchCachedApplyCourses } from '@/lib/apply/fetch-cached-apply-courses'
import type { ApplyCourse } from '@/lib/apply/types'
import { presignCourseMediaKey } from '@/lib/r2/course-media-urls'

export async function fetchPublishedApplyCoursesFromCache(): Promise<ApplyCourse[]> {
  const courses = await fetchCachedApplyCourses()
  return Promise.all(
    courses.map(async (course) => ({
      ...course,
      thumbnail_url: await presignCourseMediaKey(course.thumbnail_r2_key),
    })),
  )
}

export async function fetchPublishedApplyCourses(
  supabase: SupabaseClient,
): Promise<ApplyCourse[]> {
  void supabase
  return fetchPublishedApplyCoursesFromCache()
}

export async function fetchEnrolledCourseIds(
  supabase: SupabaseClient,
  studentDbIds: string | string[],
): Promise<string[]> {
  const ids = Array.isArray(studentDbIds) ? studentDbIds : [studentDbIds]
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('enrollments')
    .select('course_id')
    .in('student_id', ids)
    .eq('status', 'active')

  return [...new Set((data ?? []).map((row) => row.course_id as string))]
}
