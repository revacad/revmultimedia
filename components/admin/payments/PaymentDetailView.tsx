import Link from 'next/link'
import OverdueInvoiceBanner from '@/components/admin/OverdueInvoiceBanner'
import InvoiceStatusBadge from '@/components/admin/payments/InvoiceStatusBadge'
import InvoiceTypeBadge from '@/components/admin/payments/InvoiceTypeBadge'
import CopyableReference from '@/components/ui/CopyableReference'
import RecordPaymentForm from '@/components/admin/payments/RecordPaymentForm'
import ResendInvoiceButton from '@/components/admin/payments/ResendInvoiceButton'
import type { AdminRole } from '@/lib/auth/admin'
import { isStaffAdmin } from '@/lib/auth/permissions'
import { getEffectiveInvoiceBalance } from '@/lib/payments/guards'
import { PAYMENT_METHOD_LABELS } from '@/lib/payments/status'
import {
  formatAmountGhs,
  formatPaymentDate,
  formatPaymentDateTime,
  isOverdue,
} from '@/lib/payments/format'
import { formatInvoiceType } from '@/lib/payments/format-invoice-type'
import type { InvoiceDetail } from '@/lib/payments/types'
import { cn } from '@/lib/utils'

interface PaymentDetailViewProps {
  invoice: InvoiceDetail
  viewerRole: AdminRole
}

export default function PaymentDetailView({ invoice, viewerRole }: PaymentDetailViewProps) {
  const application = invoice.applications
  const canViewApplication = isStaffAdmin(viewerRole)
  const paymentForLabel =
    formatInvoiceType(invoice.type, invoice.payment_type?.label)
  const { paid, remaining, overpaid } = getEffectiveInvoiceBalance(
    {
      status: invoice.status,
      total_ghs: invoice.total_ghs,
      payment_method: invoice.payment_method,
      paystack_reference: invoice.paystack_reference,
    },
    invoice.installments,
  )
  const progress =
    invoice.total_ghs > 0 ? Math.min(100, (paid / invoice.total_ghs) * 100) : 0
  const overdue = isOverdue(invoice.due_date, invoice.status)
  const fillColor = progress >= 100 ? '#C74A86' : '#2DBFB8'

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/admin/payments"
        className="mb-6 inline-block font-body text-sm text-[#9898B8] hover:text-[#1A1A2E]"
      >
        {'<'} Payment Tracker
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,65%)_minmax(0,35%)]">
        <div>
          <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
            <CopyableReference reference={invoice.reference} monoClassName="text-2xl font-medium" />
            <div className="mt-3 flex flex-wrap gap-2">
              <InvoiceTypeBadge
                type={invoice.type}
                label={invoice.payment_type?.label}
              />
              <InvoiceStatusBadge status={invoice.status} dueDate={invoice.due_date} />
            </div>
            {overdue ? (
              <div className="mt-4">
                <OverdueInvoiceBanner contactLabel="Contact student" />
              </div>
            ) : null}
            <p className="mt-4 font-display text-xl font-semibold text-[#1A1A2E]">
              {application?.full_name ?? '—'}
            </p>
            <p className="font-body text-sm text-[#9898B8]">
              {application?.courses?.title ?? '—'}
              {application?.intakes?.name ? ` · ${application.intakes.name}` : ''}
            </p>
          </section>

          <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
            <div className="space-y-2 font-body text-sm">
              <div className="flex justify-between">
                <span className="text-[#9898B8]">Tuition amount</span>
                <span>{formatAmountGhs(invoice.amount_ghs)}</span>
              </div>
              {invoice.discount_ghs > 0 && (
                <div className="flex justify-between text-[#1E9990]">
                  <span>
                    Discount
                    {invoice.promo_codes ? ` (${invoice.promo_codes.code})` : ''}
                  </span>
                  <span>- {formatAmountGhs(invoice.discount_ghs)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between border-t border-[#EFEFF5] pt-4">
              <span className="font-body text-sm font-semibold">Total due</span>
              <span className="font-display text-[28px] font-semibold text-[#C74A86]">
                {formatAmountGhs(invoice.total_ghs)}
              </span>
            </div>
            <div className="mt-3 flex justify-between font-body text-sm">
              <span className="text-[#9898B8]">Amount paid</span>
              <span className="font-semibold text-[#1E9990]">{formatAmountGhs(paid)}</span>
            </div>
            <div className="flex justify-between font-body text-sm">
              <span className="text-[#9898B8]">Remaining</span>
              <span className={cn('font-semibold', remaining > 0 ? 'text-[#E84A4A]' : 'text-[#1E9990]')}>
                {formatAmountGhs(remaining)}
              </span>
            </div>
            {overpaid > 0 && (
              <div className="flex justify-between font-body text-sm">
                <span className="text-[#9898B8]">Overpaid</span>
                <span className="font-semibold text-[#C74A86]">
                  {formatAmountGhs(overpaid)}
                </span>
              </div>
            )}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#EFEFF5]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: fillColor }}
              />
            </div>
          </section>

          <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
              Payment History
            </h2>
            {invoice.installments.length === 0 &&
            invoice.payment_method === 'paystack' &&
            invoice.paystack_reference ? (
              <div className="py-2">
                <p className="font-body text-[15px] font-semibold text-[#1A1A2E]">
                  {formatAmountGhs(invoice.total_ghs)}
                </p>
                <span className="mt-1 inline-flex rounded-full bg-[#F7F8FC] px-2 py-0.5 font-body text-xs font-semibold text-[#5A5A7A]">
                  Paystack
                </span>
                <p className="mt-1 font-mono text-xs text-[#9898B8]">
                  {invoice.paystack_reference}
                </p>
              </div>
            ) : invoice.installments.length === 0 ? (
              <p className="font-body text-sm text-[#9898B8]">No payments recorded yet</p>
            ) : (
              <ul>
                {invoice.installments.map((inst, index) => (
                  <li
                    key={inst.id}
                    className={cn(
                      'py-4',
                      index < invoice.installments.length - 1 && 'border-b border-[#EFEFF5]',
                    )}
                  >
                    <p className="font-body text-[15px] font-semibold text-[#1A1A2E]">
                      {formatAmountGhs(Number(inst.amount_ghs))}
                    </p>
                    <span className="mt-1 inline-flex rounded-full bg-[#F7F8FC] px-2 py-0.5 font-body text-xs font-semibold text-[#5A5A7A]">
                      {PAYMENT_METHOD_LABELS[inst.payment_method] ?? inst.payment_method}
                    </span>
                    {inst.transaction_ref && (
                      <p className="mt-1 font-mono text-xs text-[#9898B8]">{inst.transaction_ref}</p>
                    )}
                    {inst.payment_note && (
                      <p className="mt-1 font-body text-[13px] text-[#5A5A7A]">{inst.payment_note}</p>
                    )}
                    <p className="mt-2 font-body text-xs text-[#9898B8]">
                      {inst.admins?.full_name ?? 'Admin'} · {formatPaymentDateTime(inst.paid_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
              Record a Payment
            </h2>
            <RecordPaymentForm
              invoiceId={invoice.id}
              totalGhs={invoice.total_ghs}
              paidGhs={paid}
              remainingGhs={remaining}
              status={invoice.status}
              paymentForLabel={paymentForLabel}
              invoiceType={invoice.type}
              studentName={application?.full_name ?? '—'}
              applicationReference={application?.reference ?? invoice.reference}
            />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Student</h2>
            {application ? (
              <div className="space-y-2 font-body text-sm text-[#5A5A7A]">
                <p className="font-semibold text-[#1A1A2E]">{application.full_name}</p>
                {application.students?.student_id ? (
                  <p className="font-mono text-[13px] text-[#5A5A7A]">
                    {application.students.student_id}
                  </p>
                ) : null}
                <p>{application.real_email}</p>
                <p>{application.phone || '—'}</p>
                <p>{application.courses?.title ?? '—'}</p>
                <p>{application.intakes?.name ?? '—'}</p>
                {canViewApplication ? (
                  <Link
                    href={`/admin/applications/${application.id}`}
                    className="inline-block font-mono text-[13px] text-[#C74A86] hover:underline"
                  >
                    {application.reference}
                  </Link>
                ) : (
                  <p className="font-mono text-[13px] text-[#5A5A7A]">{application.reference}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#9898B8]">—</p>
            )}
          </section>

          <section className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Invoice info</h2>
            <div className="space-y-2 font-body text-sm text-[#5A5A7A]">
              <p>
                <span className="text-[#9898B8]">Created:</span>{' '}
                {formatPaymentDateTime(invoice.created_at)}
              </p>
              <p>
                <span className="text-[#9898B8]">Due:</span>{' '}
                <span className={overdue ? 'text-[#E84A4A]' : ''}>
                  {invoice.due_date ? formatPaymentDate(invoice.due_date) : '—'}
                </span>
              </p>
              <p>
                <span className="text-[#9898B8]">Created by:</span>{' '}
                {invoice.admins?.full_name ?? '—'}
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">Quick actions</h2>
            <div className="flex flex-col gap-3">
              {canViewApplication && application && (
                <Link
                  href={`/admin/applications/${application.id}`}
                  className="font-body text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  View Application
                </Link>
              )}
              <ResendInvoiceButton invoiceId={invoice.id} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
