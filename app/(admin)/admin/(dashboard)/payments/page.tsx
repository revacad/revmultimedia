import PaymentsPageClient from '@/components/admin/payments/PaymentsPageClient'
import { mapPaymentListRow } from '@/lib/payments/map'
import { fetchPendingManualPaymentClaims } from '@/lib/payments/manual-claims'
import { ADMIN_PAGE_SIZE, adminListRange, parseAdminPage } from '@/lib/admin/pagination'
import { requireFinanceAccess } from '@/lib/auth/requireAdmin'
import { supabaseErrorMessage } from '@/lib/errors/query'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Payments - Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string }>
}) {
  const admin = await requireFinanceAccess()
  const { page: pageParam, tab } = await searchParams
  const defaultTab = tab === 'claims' ? 'claims' : 'invoices'
  const page = parseAdminPage(pageParam)
  const { from, to } = adminListRange(page)

  const supabase = createAdminClient()
  const { data, error, count } = await supabase
    .from('invoices')
    .select(
      `
      id, reference, type, amount_ghs, discount_ghs, total_ghs,
      due_date, status, payment_method, paystack_reference, created_at, updated_at,
      payment_types(slug, label),
      applications(
        id, reference, full_name, real_email, phone, country,
        courses(title),
        intakes(name),
        students!students_application_id_fkey(full_name, student_id),
        returning_student:students!applications_returning_student_id_fkey(full_name, student_id)
      ),
      installments(amount_ghs, paid_at)
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[admin/payments] fetch failed', error)
  }

  const fetchError = error ? supabaseErrorMessage(error, 'admin/payments') : null

  const invoices = (data ?? []).map((row) =>
    mapPaymentListRow(row as Record<string, unknown>),
  )

  const paymentClaims = await fetchPendingManualPaymentClaims(supabase)

  return (
    <PaymentsPageClient
      invoices={invoices}
      paymentClaims={paymentClaims}
      fetchError={fetchError}
      viewerRole={admin.role}
      currentPage={page}
      totalCount={count ?? 0}
      pageSize={ADMIN_PAGE_SIZE}
      defaultTab={defaultTab}
    />
  )
}
