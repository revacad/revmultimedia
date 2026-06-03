import type { Metadata } from 'next'
import ApplyPageClient from '@/components/public/apply/ApplyPageClient'
import { mapApplyCourses } from '@/lib/apply/map-courses'
import { withCache } from '@/lib/redis/cache'
import { siteUrl } from '@/lib/seo'
import { createServerClient } from '@/lib/supabase/server'
import { applySearchParamsSchema } from '@/lib/validations/common'

export const metadata: Metadata = {
  title: 'Apply | Rev Multimedia',
  description:
    'Apply to study Graphic Design, Motion Graphics, or Video Editing at Rev Multimedia in Accra, Ghana.',
  alternates: {
    canonical: `${siteUrl}/apply/standard`,
  },
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

export default async function StandardApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; intake?: string }>
}) {
  const rawParams = await searchParams
  const parsedParams = applySearchParamsSchema.safeParse(rawParams)
  const params = parsedParams.success ? parsedParams.data : {}
  const courses = await withCache('courses:published', 300, fetchPublishedCourses)

  return (
    <ApplyPageClient
      applicationChannel="standard"
      courses={courses}
      preselectedCourse={params.course}
      preselectedIntake={params.intake}
    />
  )
}
