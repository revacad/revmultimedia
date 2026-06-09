import { createPublicClient } from '@/lib/supabase/public'
import { mapApplyCourses } from '@/lib/apply/map-courses'
import type { ApplyCourse } from '@/lib/apply/types'
import type { Intake } from '@/lib/courses/types'
import { fetchCachedActiveIntakes } from '@/lib/intakes/fetch-active-intakes'

export async function fetchCachedApplyCourses(): Promise<ApplyCourse[]> {
  const supabase = createPublicClient()
  const [coursesResult, intakes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, slug, category, mode, tuition_fee_ghs, thumbnail_r2_key')
      .eq('is_published', true)
      .order('title'),
    fetchCachedActiveIntakes(),
  ])

  if (coursesResult.error) {
    console.error('[apply] fetchCachedApplyCourses courses failed', coursesResult.error)
    return []
  }

  const intakesByCourseId = new Map<string, Intake[]>()
  for (const intake of intakes) {
    const list = intakesByCourseId.get(intake.course_id) ?? []
    list.push(intake)
    intakesByCourseId.set(intake.course_id, list)
  }

  const rows = (coursesResult.data ?? []).map((course) => ({
    ...course,
    intakes: intakesByCourseId.get(course.id as string) ?? [],
  }))

  return mapApplyCourses(rows)
}
