import PaymentsPageClient from '@/components/admin/payments/PaymentsPageClient'
import { mapPaymentListRow } from '@/lib/payments/map'
import { requireFinanceAccess } from '@/lib/auth/requireAdmin'
import { supabaseErrorMessage } from '@/lib/errors/query'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Payments — Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  await requireFinanceAccess()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      id, reference, type, amount_ghs, discount_ghs, total_ghs,
      due_date, status, payment_method, paystack_reference, created_at, updated_at,
      payment_types(slug, label),
      applications(id, reference, full_name, real_email, country),
      installments(amount_ghs, paid_at)
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/payments] fetch failed', error)
  }

  const fetchError = error ? supabaseErrorMessage(error, 'admin/payments') : null

  const invoices = (data ?? []).map((row) =>
    mapPaymentListRow(row as Record<string, unknown>),
  )

  return <PaymentsPageClient invoices={invoices} fetchError={fetchError} />
}
