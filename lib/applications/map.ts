import type {
  ApplicationAdminNote,
  ApplicationDetail,
  ApplicationListRow,
} from '@/lib/applications/types'
import type { CourseCategory } from '@/lib/courses/types'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function mapApplicationListRow(row: Record<string, unknown>): ApplicationListRow {
  const courses = firstRelation(row.courses as ApplicationListRow['courses'] | ApplicationListRow['courses'][] | null)
  const intakes = firstRelation(row.intakes as ApplicationListRow['intakes'] | ApplicationListRow['intakes'][] | null)

  return {
    id: row.id as string,
    reference: row.reference as string,
    full_name: row.full_name as string,
    real_email: row.real_email as string,
    phone: row.phone as string,
    country: row.country as string,
    status: row.status as ApplicationListRow['status'],
    app_fee_paid: row.app_fee_paid as boolean,
    created_at: row.created_at as string,
    courses: courses
      ? {
          title: courses.title,
          category: courses.category as CourseCategory,
        }
      : null,
    intakes: intakes
      ? {
          name: intakes.name,
          start_date: intakes.start_date,
        }
      : null,
  }
}

export function mapApplicationDetail(row: Record<string, unknown>): ApplicationDetail {
  const courses = firstRelation(
    row.courses as ApplicationDetail['courses'] | NonNullable<ApplicationDetail['courses']>[] | null,
  )
  const intakes = firstRelation(
    row.intakes as ApplicationDetail['intakes'] | NonNullable<ApplicationDetail['intakes']>[] | null,
  )
  const adminNotesRaw = (row.admin_notes as ApplicationAdminNote[] | null) ?? []
  const admin_notes = adminNotesRaw.map((note) => ({
    ...note,
    admins: firstRelation(note.admins as { full_name: string } | { full_name: string }[] | null),
  }))

  return {
    ...(row as unknown as ApplicationDetail),
    courses: courses
      ? {
          ...courses,
          category: courses.category as CourseCategory,
          tuition_fee_ghs: Number(courses.tuition_fee_ghs),
        }
      : null,
    intakes,
    documents: (row.documents as ApplicationDetail['documents']) ?? [],
    invoices: ((row.invoices as ApplicationDetail['invoices']) ?? []).map((inv) => ({
      ...inv,
      amount_ghs: Number(inv.amount_ghs),
      total_ghs: Number(inv.total_ghs),
    })),
    admin_notes,
  }
}
