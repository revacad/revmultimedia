import { createServerClient } from '@/lib/supabase/server'

export type PortalAccess = {
  type: 'applicant' | 'student'
  appFeePaid: boolean
  fullAccess: boolean
  applicationRef?: string
  invoiceRef?: string
  appFeeAmount?: number
  userId: string
  payerEmail?: string
}

type InvoiceRow = {
  reference: string
  amount_ghs: number
  type: string
  status: string
}

export async function getPortalAccess(): Promise<PortalAccess | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('id, student_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (student) {
    return {
      type: 'student',
      appFeePaid: true,
      fullAccess: true,
      userId: user.id,
    }
  }

  const { data: application } = await supabase
    .from('applications')
    .select(
      `
      id, reference, app_fee_paid, real_email,
      invoices(reference, amount_ghs, type, status)
    `,
    )
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!application) return null

  const invoices = (application.invoices ?? []) as InvoiceRow[]
  const appFeeInvoice = invoices.find((inv) => inv.type === 'application_fee')

  return {
    type: 'applicant',
    appFeePaid: Boolean(application.app_fee_paid),
    fullAccess: Boolean(application.app_fee_paid),
    applicationRef: application.reference,
    invoiceRef: appFeeInvoice?.reference,
    appFeeAmount: appFeeInvoice
      ? Number(appFeeInvoice.amount_ghs)
      : undefined,
    userId: user.id,
    payerEmail: application.real_email,
  }
}
