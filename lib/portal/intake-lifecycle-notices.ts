import { todayDateString } from '@/lib/intakes/lifecycle'
import { formatDate } from '@/lib/utils'

export type ProgrammeLifecycleNotice = {
  courseTitle: string
  endDateLabel: string
  variant: 'scheduled_end' | 'closed'
}

type EnrollmentRow = {
  intakes:
    | {
        end_date: string
        is_closed: boolean
        courses: { title: string } | { title: string }[] | null
      }
    | {
        end_date: string
        is_closed: boolean
        courses: { title: string } | { title: string }[] | null
      }[]
    | null
}

function resolveCourseTitle(
  courses: { title: string } | { title: string }[] | null | undefined,
): string {
  if (!courses) return 'Course'
  const row = Array.isArray(courses) ? courses[0] : courses
  return row?.title ?? 'Course'
}

export function buildProgrammeLifecycleNotices(
  enrollments: EnrollmentRow[],
  today: string = todayDateString(),
): ProgrammeLifecycleNotice[] {
  const notices: ProgrammeLifecycleNotice[] = []

  for (const enrollment of enrollments) {
    const intake = Array.isArray(enrollment.intakes)
      ? enrollment.intakes[0]
      : enrollment.intakes
    if (!intake?.end_date || intake.end_date >= today) continue

    notices.push({
      courseTitle: resolveCourseTitle(intake.courses),
      endDateLabel: formatDate(intake.end_date),
      variant: intake.is_closed ? 'closed' : 'scheduled_end',
    })
  }

  return notices
}
