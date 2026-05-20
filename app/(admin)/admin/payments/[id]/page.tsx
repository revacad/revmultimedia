import { notFound } from 'next/navigation'
import PaymentDetailView from '@/components/admin/payments/PaymentDetailView'
import { mapInvoiceDetail } from '@/lib/payments/map'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      applications(*, courses(title), intakes(name, start_date)),
      installments(*, admins(full_name)),
      promo_codes(code, discount_type, discount_value),
      admins(full_name)
    `,
    )
    .eq('id', id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  return <PaymentDetailView invoice={mapInvoiceDetail(invoice as Record<string, unknown>)} />
}
