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
}

type EnrollmentRow = {
  id: string
  status: string
  enrolled_at: string | null
  students: StudentEmbed | StudentEmbed[] | null
  courses: { title: string } | { title: string }[] | null
  intakes: { name: string } | { name: string }[] | null
}

export async function fetchEnrolledStudentsGrouped(
  supabase: SupabaseClient,
  range: { from: number; to: number },
): Promise<{ students: EnrolledStudentListItem[]; totalCount: number }> {
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
        profile_photo_r2_key
      ),
      courses(title),
      intakes(name)
    `,
    )
    .in('status', ['active', 'completed'])

  if (error) {
    console.error('[fetchEnrolledStudentsGrouped]', error)
    return { students: [], totalCount: 0 }
  }

  const groups = new Map<
    string,
    {
      canonical: StudentEmbed
      enrollments: EnrolledStudentListItem['enrollments']
      latestEnrolledAt: string | null
    }
  >()

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

    const existing = groups.get(authUserId)
    if (!existing) {
      groups.set(authUserId, {
        canonical: student,
        enrollments: [enrollment],
        latestEnrolledAt: row.enrolled_at,
      })
      continue
    }

    existing.enrollments.push(enrollment)
    if (
      row.enrolled_at &&
      (!existing.latestEnrolledAt ||
        new Date(row.enrolled_at) > new Date(existing.latestEnrolledAt))
    ) {
      existing.latestEnrolledAt = row.enrolled_at
    }

    if (new Date(student.created_at) < new Date(existing.canonical.created_at)) {
      existing.canonical = student
    }
  }

  const sorted = [...groups.entries()].sort((a, b) => {
    const aTime = a[1].latestEnrolledAt ? new Date(a[1].latestEnrolledAt).getTime() : 0
    const bTime = b[1].latestEnrolledAt ? new Date(b[1].latestEnrolledAt).getTime() : 0
    return bTime - aTime
  })

  const totalCount = sorted.length
  const pageSlice = sorted.slice(range.from, range.to + 1)

  const students: EnrolledStudentListItem[] = await Promise.all(
    pageSlice.map(async ([authUserId, group]) => {
      const canonical = group.canonical
      const profilePhotoUrl = await getPrivateR2PresignedUrl(
        canonical.profile_photo_r2_key,
      )

      return {
        authUserId,
        studentDbId: canonical.id,
        student_id: canonical.student_id,
        full_name: canonical.full_name,
        real_email: canonical.real_email,
        phone: canonical.phone,
        country: canonical.country,
        profilePhotoUrl,
        latestEnrolledAt: group.latestEnrolledAt,
        enrollments: group.enrollments.sort((a, b) => {
          const aTime = a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0
          const bTime = b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0
          return bTime - aTime
        }),
      }
    }),
  )

  return { students, totalCount }
}
