import type { SupabaseClient } from '@supabase/supabase-js'
import { getPrivateR2PresignedUrl } from '@/lib/r2/private-object-url'

export type EnrolledStudentListItem = {
  authUserId: string
  studentDbId: string
  student_id: string
  full_name: string
  real_email: string
  phone: string
  country: string
  profilePhotoUrl: string | null
  latestEnrolledAt: string | null
  isLevelUp: boolean
  enrollments: {
    id: string
    status: string
    courseTitle: string
    intakeName: string
    enrolledAt: string | null
  }[]
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function enrolledAtMs(value: string | null): number {
  return value ? new Date(value).getTime() : 0
}

type StudentEmbed = {
  id: string
  student_id: string
  auth_user_id: string
  full_name: string
  real_email: string
  phone: string
  country: string
  created_at: string
  profile_photo_r2_key: string | null
  applications: { application_channel: string } | { application_channel: string }[] | null
}

type EnrollmentRow = {
  id: string
  status: string
  enrolled_at: string | null
  students: StudentEmbed | StudentEmbed[] | null
  courses: { title: string } | { title: string }[] | null
  intakes: { name: string } | { name: string }[] | null
}

type StudentGroup = {
  canonical: StudentEmbed
  enrollments: EnrolledStudentListItem['enrollments']
  latestEnrolledAt: string | null
  latestEnrolledMs: number
  isLevelUp: boolean
}

function studentIsLevelUp(student: StudentEmbed): boolean {
  const application = firstRelation(student.applications)
  return application?.application_channel === 'level_up'
}

export async function fetchEnrolledStudentsGrouped(
  supabase: SupabaseClient,
  range: { from: number; to: number },
): Promise<{
  students: EnrolledStudentListItem[]
  totalCount: number
  channelCounts: { all: number; standard: number; level_up: number }
}> {
  const { data: enrollmentRows, error } = await supabase
    .from('enrollments')
    .select(
      `
      id,
      status,
      enrolled_at,
      students!inner(
        id,
        student_id,
        auth_user_id,
        full_name,
        real_email,
        phone,
        country,
        created_at,
        profile_photo_r2_key,
        applications(application_channel)
      ),
      courses(title),
      intakes(name)
    `,
    )
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('[fetchEnrolledStudentsGrouped]', error)
    return {
      students: [],
      totalCount: 0,
      channelCounts: { all: 0, standard: 0, level_up: 0 },
    }
  }

  const groups = new Map<string, StudentGroup>()

  for (const row of (enrollmentRows ?? []) as EnrollmentRow[]) {
    const student = firstRelation(row.students)
    if (!student) continue

    const course = firstRelation(row.courses)
    const intake = firstRelation(row.intakes)
    const authUserId = student.auth_user_id

    const enrollment = {
      id: row.id,
      status: row.status,
      courseTitle: course?.title ?? 'Course',
      intakeName: intake?.name ?? 'Intake',
      enrolledAt: row.enrolled_at,
    }

    const enrolledMs = enrolledAtMs(row.enrolled_at)
    const existing = groups.get(authUserId)

    if (!existing) {
      groups.set(authUserId, {
        canonical: student,
        enrollments: [enrollment],
        latestEnrolledAt: row.enrolled_at,
        latestEnrolledMs: enrolledMs,
        isLevelUp: studentIsLevelUp(student),
      })
      continue
    }

    existing.enrollments.push(enrollment)
    if (studentIsLevelUp(student)) {
      existing.isLevelUp = true
    }
    if (enrolledMs > existing.latestEnrolledMs) {
      existing.latestEnrolledAt = row.enrolled_at
      existing.latestEnrolledMs = enrolledMs
    }

    if (student.created_at < existing.canonical.created_at) {
      existing.canonical = student
    }
  }

  const sorted = [...groups.values()].sort(
    (a, b) => b.latestEnrolledMs - a.latestEnrolledMs,
  )

  const totalCount = sorted.length
  const channelCounts = {
    all: totalCount,
    standard: sorted.filter((group) => !group.isLevelUp).length,
    level_up: sorted.filter((group) => group.isLevelUp).length,
  }
  const pageGroups = sorted.slice(range.from, range.to + 1)

  for (const group of pageGroups) {
    group.enrollments.sort(
      (a, b) => enrolledAtMs(b.enrolledAt) - enrolledAtMs(a.enrolledAt),
    )
  }

  const students: EnrolledStudentListItem[] = await Promise.all(
    pageGroups.map(async (group) => {
      const canonical = group.canonical
      const profilePhotoUrl = await getPrivateR2PresignedUrl(
        canonical.profile_photo_r2_key,
      )

      return {
        authUserId: canonical.auth_user_id,
        studentDbId: canonical.id,
        student_id: canonical.student_id,
        full_name: canonical.full_name,
        real_email: canonical.real_email,
        phone: canonical.phone,
        country: canonical.country,
        profilePhotoUrl,
        latestEnrolledAt: group.latestEnrolledAt,
        isLevelUp: group.isLevelUp,
        enrollments: group.enrollments,
      }
    }),
  )

  return { students, totalCount, channelCounts }
}
