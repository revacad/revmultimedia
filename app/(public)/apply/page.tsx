import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { withCache } from '@/lib/redis/cache'
import { mapApplyCourses } from '@/lib/apply/map-courses'
import ApplyPageClient from '@/components/public/apply/ApplyPageClient'

export const metadata: Metadata = {
  title: 'Apply Now',
  description:
    'Apply for a course at Rev Multimedia. Graphic Design, Motion Graphics, and Video Editing programmes available.',
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
