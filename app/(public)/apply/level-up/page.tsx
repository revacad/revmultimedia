import type { Metadata } from 'next'
import ApplyPageClient from '@/components/public/apply/ApplyPageClient'
import { fetchCachedApplyCourses } from '@/lib/apply/fetch-cached-apply-courses'
import { siteUrl } from '@/lib/seo'
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
  return fetchCachedApplyCourses()
}

export default async function LevelUpApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; intake?: string }>
}) {
  const rawParams = await searchParams
  const parsedParams = applySearchParamsSchema.safeParse(rawParams)
  const params = parsedParams.success ? parsedParams.data : {}
  const courses = await fetchPublishedCourses()
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
