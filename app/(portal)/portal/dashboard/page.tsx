import { notFound } from 'next/navigation'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import PortalDashboardHero from '@/components/portal/PortalDashboardHero'
import PortalStatusCard from '@/components/portal/PortalStatusCard'
import PortalApplyCoursesSection from '@/components/portal/PortalApplyCoursesSection'
import WaitlistedPortalView from '@/components/portal/WaitlistedPortalView'
import PortalDashboardEmptyApplications from '@/components/portal/PortalDashboardEmptyApplications'
import PortalErrorState from '@/components/portal/PortalErrorState'
import type { ApplicationPickerItem } from '@/components/portal/ApplicationPicker'
import type { CourseCategory, CourseMode } from '@/lib/courses/types'
import type { ApplicationStatus } from '@/lib/applications/types'
import { createServerClient } from '@/lib/supabase/server'
import {
  firstName,
  resolveTimelineActiveStep,
  timelineOptionsFromInvoices,
} from '@/lib/portal/timeline'
import { fetchEnrolledCourseIds, fetchPublishedApplyCourses } from '@/lib/portal/fetch-apply-courses'
import type { InvoiceStatus } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'

async function PortalDashboardContent({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string }>
}) {
  const user = await requirePortalUser()
  const supabase = await createServerClient()
  const rawParams = (await searchParams) ?? {}

  const { data: student } = await supabase
    .from('students')
    .select('id, student_id, full_name, profile_photo_r2_key')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  const { data: applications } = await supabase
    .from('applications')
    .select(
      `
      *,
      courses(title, category, mode, tuition_fee_ghs),
      intakes(name, start_date, end_date),
      invoices(*, installments(amount_ghs))
    `,
    )
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false })

  const appList = applications ?? []

  if (appList.length === 0) {
    return <PortalDashboardEmptyApplications />
  }

  const pickerItems: ApplicationPickerItem[] = appList.map((row) => ({
    id: row.id as string,
    reference: row.reference as string,
    courseTitle: Array.isArray(row.courses)
      ? (row.courses[0]?.title ?? null)
      : ((row.courses as { title: string } | null)?.title ?? null),
  }))

  if (
    rawParams.applicationId &&
    !appList.some((row) => row.id === rawParams.applicationId)
  ) {
    notFound()
  }

  const selectedId = rawParams.applicationId ?? pickerItems[0]?.id
  const application = appList.find((a) => a.id === selectedId) ?? appList[0]

  const displayName =
    student?.full_name ??
    (application?.full_name as string | undefined) ??
    'Student'

  if (application?.status === 'waitlisted') {
    const course = application.courses as {
      title: string
      category: CourseCategory
      mode: CourseMode
    } | null
    const intake = application.intakes as { name: string; start_date: string } | null
    return (
      <WaitlistedPortalView
        fullName={application.full_name as string}
        reference={application.reference as string}
        waitlistPosition={application.waitlist_position as number | null}
        course={
          course
            ? { title: course.title, category: course.category, mode: course.mode }
            : null
        }
        intake={intake ? { name: intake.name, start_date: intake.start_date } : null}
      />
    )
  }

  const invoices =
    (application?.invoices as {
      type: string
      status: InvoiceStatus
      installments?: { amount_ghs: number }[] | null
    }[]) ?? []

  const activeStep = application
    ? resolveTimelineActiveStep(
        application.status as string,
        timelineOptionsFromInvoices(application, invoices),
      )
    : 1

  const enrolledCourseIds = student
    ? await fetchEnrolledCourseIds(supabase, student.id)
    : []
  const applyCourses = student ? await fetchPublishedApplyCourses(supabase) : []

  const heroIdentifier = student
    ? (student.student_id as string)
    : (application?.reference as string) ?? '—'
  const heroIdentifierLabel = student ? 'Student ID' : 'Application reference'

  return (
    <div className="space-y-6 pb-4">
      <PortalDashboardHero
        displayName={firstName(displayName)}
        identifier={heroIdentifier}
        identifierLabel={heroIdentifierLabel}
        statusVariant={application?.status as ApplicationStatus | undefined}
        enrolled={Boolean(student)}
      />

      {application ? (
        <PortalStatusCard
          applications={pickerItems.length > 1 ? pickerItems : undefined}
          activeStep={activeStep}
          applicationStatus={application.status as ApplicationStatus}
        />
      ) : null}

      {student ? (
        <PortalApplyCoursesSection
          courses={applyCourses}
          enrolledCourseIds={enrolledCourseIds}
        />
      ) : null}
    </div>
  )
}

export default async function PortalDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string }>
}) {
  try {
    return await PortalDashboardContent({ searchParams })
  } catch (error) {
    console.error('[portal/dashboard] fetch failed', error)
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-8">
        <PortalErrorState />
      </div>
    )
  }
}
