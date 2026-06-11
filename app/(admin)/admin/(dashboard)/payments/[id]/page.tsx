import { notFound } from 'next/navigation'
import PaymentDetailView from '@/components/admin/payments/PaymentDetailView'
import { mapInvoiceDetail } from '@/lib/payments/map'
import { requireFinanceAccess } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const admin = await requireFinanceAccess()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      payment_types(id, slug, label, description),
      applications(
        id, reference, full_name, real_email, phone,
        courses(title),
        intakes(name, start_date),
        students!students_application_id_fkey(full_name, student_id),
        returning_student:students!applications_returning_student_id_fkey(full_name, student_id)
      ),
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

  return (
    <PaymentDetailView
      invoice={mapInvoiceDetail(invoice as Record<string, unknown>)}
      viewerRole={admin.role}
    />
  )
}
