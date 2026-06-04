import StudentsPageClient, {
  type StudentListRow,
} from '@/components/admin/students/StudentsPageClient'
import { ADMIN_PAGE_SIZE, adminListRange, parseAdminPage } from '@/lib/admin/pagination'
import { requireStaffAdmin } from '@/lib/auth/requireAdmin'
import { getPrivateR2PresignedUrl } from '@/lib/r2/private-object-url'
import {
  deriveProgramLifecycleStatus,
  PROGRAM_STATUS_LABELS,
  sumTuitionPaidFromInvoices,
} from '@/lib/enrollment/program-status'
import { supabaseErrorMessage } from '@/lib/errors/query'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Students - Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireStaffAdmin()
  const { page: pageParam } = await searchParams
  const page = parseAdminPage(pageParam)
  const { from, to } = adminListRange(page)

  const supabase = createAdminClient()
  const { data, error, count } = await supabase
    .from('applications')
    .select(
      `
      id, reference, full_name, real_email, phone, country, created_at, status,
      enrolled_at,
      students!students_application_id_fkey(id, student_id, is_active, profile_photo_r2_key),
      invoices(type, status, total_ghs, installments(amount_ghs))
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[admin/students] fetch failed', error)
  }

  const fetchError = error ? supabaseErrorMessage(error, 'admin/students') : null

  const rows = data ?? []
  const students: StudentListRow[] = await Promise.all(
    rows.map(async (row) => {
      const rel = row.students as
        | { id: string; student_id: string; is_active: boolean; profile_photo_r2_key: string | null }
        | { id: string; student_id: string; is_active: boolean; profile_photo_r2_key: string | null }[]
        | null

      const student = Array.isArray(rel) ? (rel[0] ?? null) : rel
      const profilePhotoUrl = await getPrivateR2PresignedUrl(student?.profile_photo_r2_key)
      const invoices = (row.invoices as {
        type: string
        status: string
        total_ghs: number
        installments?: { amount_ghs: number }[] | null
      }[]) ?? []

      const { tuitionPaidGhs, tuitionInvoiceStatus } = sumTuitionPaidFromInvoices(invoices)
      const tuitionInvoice = invoices.find((inv) => inv.type === 'tuition')
      const effectiveTuitionPaid =
        tuitionPaidGhs > 0
          ? tuitionPaidGhs
          : tuitionInvoice?.status === 'paid'
            ? Number(tuitionInvoice.total_ghs ?? 0)
            : 0

      const lifecycle = deriveProgramLifecycleStatus({
        registeredAt: row.created_at,
        enrolledAt: row.enrolled_at as string | null,
        tuitionPaidGhs: effectiveTuitionPaid,
        tuitionInvoiceStatus,
        hasStudentRecord: Boolean(student),
      })

      return {
        id: row.id,
        applicationId: row.id,
        studentDbId: student?.id,
        student_id: student?.student_id ?? null,
        reference: row.reference,
        full_name: row.full_name,
        real_email: row.real_email,
        phone: row.phone,
        country: row.country,
        registered_at: row.created_at,
        enrolled_at: row.enrolled_at as string | null,
        is_active: student?.is_active ?? false,
        lifecycleStatus: lifecycle,
        lifecycleLabel: PROGRAM_STATUS_LABELS[lifecycle],
        profilePhotoUrl,
      }
    }),
  )

  return (
    <StudentsPageClient
      students={students}
      fetchError={fetchError}
      currentPage={page}
      totalCount={count ?? 0}
      pageSize={ADMIN_PAGE_SIZE}
    />
  )
}
