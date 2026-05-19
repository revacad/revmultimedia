import { createServerClient } from '@/lib/supabase/server'
import { withCache } from '@/lib/redis/cache'
import { mapApplyCourses } from '@/lib/apply/map-courses'
import ApplyPageClient from '@/components/public/apply/ApplyPageClient'

export const metadata = {
  title: 'Apply | Rev Multimedia Academy',
  description: 'Apply for the next cohort at Rev Multimedia Academy.',
}

async function fetchPublishedCourses() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('courses')
    .select('id, title, slug, category, mode, tuition_fee_ghs, intakes(*)')
    .eq('is_published', true)
    .order('title')
  return mapApplyCourses(data || [])
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; intake?: string }>
}) {
  const params = await searchParams
  const courses = await withCache('courses:published', 300, fetchPublishedCourses)

  return (
    <ApplyPageClient
      courses={courses}
      preselectedCourse={params.course}
      preselectedIntake={params.intake}
    />
  )
}
