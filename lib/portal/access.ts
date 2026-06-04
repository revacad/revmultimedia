import { linkApplicationByInternalEmail } from '@/lib/auth/link-application-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { getPortalAuthUser } from '@/lib/portal/session'

export type PortalAccess = {
  type: 'applicant' | 'student'
  appFeePaid: boolean
  fullAccess: boolean
  isWaitlisted?: boolean
  applicationRef?: string
  invoiceRef?: string
  appFeeInvoiceId?: string
  appFeeAmount?: number
  userId: string
  payerEmail?: string
}

type InvoiceRow = {
  id: string
  reference: string
  amount_ghs: number
  type: string
  status: string
}

export async function getPortalAccess(): Promise<PortalAccess | null> {
  const user = await getPortalAuthUser()
  const supabase = await createServerClient()

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

  let { data: application } = await supabase
    .from('applications')
    .select(
      `
      id, reference, app_fee_paid, real_email, status,
      invoices(id, reference, amount_ghs, type, status)
    `,
    )
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!application && user.email) {
    const admin = createAdminClient()
    await linkApplicationByInternalEmail(admin, user.id, user.email)
    const retry = await supabase
      .from('applications')
      .select(
        `
        id, reference, app_fee_paid, real_email, status,
        invoices(id, reference, amount_ghs, type, status)
      `,
      )
      .eq('auth_user_id', user.id)
      .maybeSingle()
    application = retry.data
  }

  if (!application && user.email) {
    const byEmail = await supabase
      .from('applications')
      .select(
        `
        id, reference, app_fee_paid, real_email, status,
        invoices(id, reference, amount_ghs, type, status)
      `,
      )
      .eq('internal_email', user.email)
      .maybeSingle()
    application = byEmail.data
  }

  if (!application) return null

  const isWaitlisted = application.status === 'waitlisted'

  const invoices = (application.invoices ?? []) as InvoiceRow[]
  const appFeeInvoice = invoices.find((inv) => inv.type === 'application_fee')

  return {
    type: 'applicant',
    appFeePaid: isWaitlisted ? false : Boolean(application.app_fee_paid),
    fullAccess: isWaitlisted ? true : Boolean(application.app_fee_paid),
    isWaitlisted,
    applicationRef: application.reference,
    invoiceRef: appFeeInvoice?.reference,
    appFeeInvoiceId: appFeeInvoice?.id,
    appFeeAmount: appFeeInvoice
      ? Number(appFeeInvoice.amount_ghs)
      : undefined,
    userId: user.id,
    payerEmail: application.real_email,
  }
}

export const getPortalAccessCached = cache(getPortalAccess)
