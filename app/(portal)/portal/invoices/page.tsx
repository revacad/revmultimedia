import { redirect } from 'next/navigation'
import PortalInvoiceCard from '@/components/portal/PortalInvoiceCard'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import { fetchPortalInvoicesPageData } from '@/lib/portal/fetch-invoices-page'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PortalInvoicesPage() {
  const user = await requirePortalUser()
  const supabase = await createServerClient()

  const { profile, invoicesWithReceipts, settings, country, payerEmail } =
    await fetchPortalInvoicesPageData(supabase, user.id, user.email)

  if (invoicesWithReceipts.length === 0 && !profile) {
    redirect('/portal/application')
  }

  const showInternational = country !== 'Ghana' && Boolean(settings.bank_swift_code)

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">My Invoices</h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Download invoice PDFs and payment receipts for your records.
        </p>
      </header>

      {invoicesWithReceipts.length === 0 ? (
        <p className="font-body text-sm text-[#9898B8]">No invoices yet.</p>
      ) : (
        invoicesWithReceipts.map(({ invoice, receipts }) => (
          <PortalInvoiceCard
            key={invoice.id}
            invoice={invoice}
            receipts={receipts}
            settings={settings}
            showInternational={showInternational}
            payerEmail={payerEmail}
          />
        ))
      )}
    </div>
  )
}
