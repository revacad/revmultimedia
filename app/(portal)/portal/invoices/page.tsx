import { redirect } from 'next/navigation'
import PortalInvoiceCard from '@/components/portal/PortalInvoiceCard'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import { fetchPortalInvoicesPageData } from '@/lib/portal/fetch-invoices-page'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PortalInvoicesPage() {
  const user = await requirePortalUser()
  const supabase = await createServerClient()

  const { profile, invoicesWithReceipts, settings, country, payerEmail, fetchError } =
    await fetchPortalInvoicesPageData(supabase, user.id, user.email)

  if (fetchError) {
    return (
      <div>
        <header className="mb-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">My Invoices</h1>
        </header>
        <ErrorState message="We could not load this data. Please refresh the page." />
      </div>
    )
  }

  if (invoicesWithReceipts.length === 0 && !profile) {
    redirect('/portal/dashboard')
  }

  const showInternational = country !== 'Ghana' && Boolean(settings.bank_swift_code)

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">My Invoices</h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Download invoice PDFs and payment receipts for your records.
        </p>
      </header>

      {invoicesWithReceipts.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 14l2 2 4-4M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          message="No invoices yet"
          description="Invoices will appear here once your application is processed."
          action={{ label: 'Go to dashboard', href: '/portal/dashboard' }}
        />
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
