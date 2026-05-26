import StudentsPageClient, {
  type StudentListRow,
} from '@/components/admin/students/StudentsPageClient'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  deriveProgramLifecycleStatus,
  PROGRAM_STATUS_LABELS,
  sumTuitionPaidFromInvoices,
} from '@/lib/enrollment/program-status'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Students - Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage() {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id, reference, full_name, real_email, phone, country, created_at, status,
      enrolled_at,
      students(id, student_id, is_active),
      invoices(type, status, total_ghs, installments(amount_ghs))
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/students] fetch failed', error)
  }

  const students: StudentListRow[] = (data ?? []).map((row) => {
    const rel = row.students as
      | { id: string; student_id: string; is_active: boolean }
      | { id: string; student_id: string; is_active: boolean }[]
      | null

    const student = Array.isArray(rel) ? (rel[0] ?? null) : rel
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
    }
  })

  return <StudentsPageClient students={students} />
}
