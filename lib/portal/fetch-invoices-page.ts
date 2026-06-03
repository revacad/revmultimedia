import type { SupabaseClient } from '@supabase/supabase-js'
import { buildReceiptLinksFromPortalInvoice } from '@/lib/portal/invoice-receipts'
import type { PortalReceiptLink } from '@/lib/portal/invoice-receipts'
import { fetchPortalInvoicesForUser, type PortalInvoiceRow } from '@/lib/portal/invoices'
import { getPaymentSettings } from '@/lib/portal/settings'
import { supabaseErrorMessage } from '@/lib/errors/query'

export type PortalInvoicesPageData = {
  profile: { country: string; real_email: string } | null
  invoicesWithReceipts: {
    invoice: PortalInvoiceRow
    receipts: PortalReceiptLink[]
  }[]
  settings: Record<string, string>
  country: string
  payerEmail: string
  fetchError: string | null
}

export async function fetchPortalInvoicesPageData(
  supabase: SupabaseClient,
  authUserId: string,
  userEmail: string | undefined,
): Promise<PortalInvoicesPageData> {
  const [profileRes, invoices, settings] = await Promise.all([
    supabase
      .from('applications')
      .select('country, real_email')
      .eq('auth_user_id', authUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    fetchPortalInvoicesForUser(supabase, authUserId),
    getPaymentSettings(),
  ])

  const profileError = profileRes.error
    ? supabaseErrorMessage(profileRes.error, 'portal/invoices/profile')
    : null

  const profile = profileRes.data
  const invoicesWithReceipts = invoices.map((invoice) => ({
    invoice,
    receipts: buildReceiptLinksFromPortalInvoice(invoice),
  }))

  return {
    profile,
    invoicesWithReceipts,
    settings,
    country: profile?.country ?? 'Ghana',
    payerEmail: profile?.real_email ?? userEmail ?? '',
    fetchError: profileError,
  }
}
