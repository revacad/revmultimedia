import type { Metadata } from 'next'
import ApplyPageClient from '@/components/public/apply/ApplyPageClient'
import { fetchCachedApplyCourses } from '@/lib/apply/fetch-cached-apply-courses'
import { siteUrl } from '@/lib/seo'
import { getApplicationFeeGhs } from '@/lib/settings/application-fee'
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
  return fetchCachedApplyCourses()
}

export default async function StandardApplyPage({
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
      applicationChannel="standard"
      courses={courses}
      preselectedCourse={params.course}
      preselectedIntake={params.intake}
      applicationFeeGhs={applicationFeeGhs}
    />
  )
}
