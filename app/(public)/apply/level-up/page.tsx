import type { Metadata } from 'next'
import ApplyPageClient from '@/components/public/apply/ApplyPageClient'
import { mapApplyCourses } from '@/lib/apply/map-courses'
import { withCache } from '@/lib/redis/cache'
import { siteUrl } from '@/lib/seo'
import { createServerClient } from '@/lib/supabase/server'
import { getApplicationFeeGhs } from '@/lib/settings/application-fee'
import { applySearchParamsSchema } from '@/lib/validations/common'

export const metadata: Metadata = {
  title: 'Senior High School Level Up Apply | Rev Multimedia',
  description:
    'Senior high school students in Ghana can apply to Rev Multimedia Level Up programmes.',
  alternates: {
    canonical: `${siteUrl}/apply/level-up`,
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

export default async function LevelUpApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; intake?: string }>
}) {
  const rawParams = await searchParams
  const parsedParams = applySearchParamsSchema.safeParse(rawParams)
  const params = parsedParams.success ? parsedParams.data : {}
  const courses = await withCache('courses:published', 300, fetchPublishedCourses)
  const applicationFeeGhs = await getApplicationFeeGhs()

  return (
    <ApplyPageClient
      applicationChannel="level_up"
      courses={courses}
      preselectedCourse={params.course}
      preselectedIntake={params.intake}
      applicationFeeGhs={applicationFeeGhs}
    />
  )
}
