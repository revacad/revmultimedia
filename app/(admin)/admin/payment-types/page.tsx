import PaymentTypesPageClient, {
  type PaymentTypeAdminRow,
} from '@/components/admin/payment-types/PaymentTypesPageClient'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { listAllPaymentTypes } from '@/lib/payments/payment-types'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Payment Types — Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminPaymentTypesPage() {
  await requireAdmin()
  const supabase = createAdminClient()
  const rows = await listAllPaymentTypes(supabase)

  const paymentTypes: PaymentTypeAdminRow[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    label: row.label,
    description: row.description,
    is_active: row.is_active,
    sort_order: row.sort_order,
    allow_paystack: row.allow_paystack ?? false,
  }))

  return <PaymentTypesPageClient paymentTypes={paymentTypes} />
}
