import { redirect } from 'next/navigation'
import { requirePortalUser } from '@/lib/auth/requirePortalUser'
import InvoiceStatusBadge from '@/components/admin/payments/InvoiceStatusBadge'
import PortalInvoicePaymentCard from '@/components/portal/PortalInvoicePaymentCard'
import { formatApplicationDate } from '@/lib/applications/format'
import { getPaymentSettings } from '@/lib/portal/settings'
import type { InvoiceStatus } from '@/lib/payments/types'
import { createServerClient } from '@/lib/supabase/server'
import { formatGHS } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const INVOICE_TYPE_LABELS: Record<string, string> = {
  application_fee: 'Application Fee',
  tuition: 'Tuition',
}

export default async function PortalInvoicesPage() {
  const user = await requirePortalUser()
  const supabase = await createServerClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, country')
    .eq('auth_user_id', user.id)
    .single()

  if (!student) redirect('/portal/application')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, installments(*)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  const settings = await getPaymentSettings()
  const showInternational =
    student.country !== 'Ghana' && Boolean(settings.bank_swift_code)

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">My Invoices</h1>
      </header>

      {(invoices ?? []).length === 0 ? (
        <p className="font-body text-sm text-[#9898B8]">No invoices yet.</p>
      ) : (
        (invoices ?? []).map((invoice) => {
          const installments = (invoice.installments as { amount_ghs: number; paid_at: string }[]) ?? []
          const paidAmount = installments.reduce((sum, row) => sum + Number(row.amount_ghs), 0)
          const total = Number(invoice.total_ghs ?? invoice.amount_ghs)
          const progress = total > 0 ? Math.min(100, (paidAmount / total) * 100) : 0
          const status = invoice.status as InvoiceStatus
          const lastPaid = installments
            .map((i) => i.paid_at)
            .filter(Boolean)
            .sort()
            .pop()

          return (
            <article key={invoice.id} className="mb-4 rounded-xl bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-mono text-sm font-medium text-[#C74A86]">{invoice.reference}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#F0F0F8] px-3 py-1 font-body text-xs font-semibold text-[#5A5A7A]">
                    {INVOICE_TYPE_LABELS[invoice.type] ?? invoice.type}
                  </span>
                  <InvoiceStatusBadge status={status} />
                </div>
              </div>

              <p className="mt-3 font-display text-2xl font-semibold text-[#1A1A2E]">{formatGHS(total)}</p>
              {invoice.due_date && (
                <p className="mt-1 font-body text-sm text-[#9898B8]">
                  Due {formatApplicationDate(invoice.due_date)}
                </p>
              )}

              {status === 'partially_paid' && (
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-[#EFEFF5]">
                    <div
                      className="h-full rounded-full bg-[#C74A86]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 font-body text-xs text-[#9898B8]">
                    {formatGHS(paidAmount)} of {formatGHS(total)} paid
                  </p>
                </div>
              )}

              {invoice.type === 'tuition' && status === 'unpaid' && (
                <PortalInvoicePaymentCard
                  settings={settings}
                  invoiceReference={invoice.reference}
                  showInternational={showInternational}
                />
              )}

              {status === 'paid' && (
                <p className="mt-4 flex items-center gap-2 font-body text-sm font-semibold text-[#1E9990]">
                  <span aria-hidden>✓</span> Payment confirmed
                  {lastPaid && (
                    <span className="font-normal text-[#9898B8]">
                      · {formatApplicationDate(lastPaid)}
                    </span>
                  )}
                </p>
              )}
            </article>
          )
        })
      )}
    </div>
  )
}
