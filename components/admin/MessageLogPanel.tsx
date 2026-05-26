import Link from 'next/link'
import { formatPaymentDateTime } from '@/lib/payments/format'

export type MessageLogEntry = {
  id: string
  source: 'notification' | 'campaign'
  channel: string
  status: string
  sentAt: string
  title: string
  body: string
  recipient?: string | null
  errorMessage?: string | null
  studentName?: string | null
  studentPublicId?: string | null
  studentProfileHref?: string | null
}

const CHANNEL_CLASS: Record<string, string> = {
  email: 'bg-[#EBF0FD] text-[#4A7BE8]',
  sms: 'bg-[#FEF6EE] text-[#C4701E]',
  whatsapp: 'bg-[#EBF9F8] text-[#1E9990]',
}

const STATUS_CLASS: Record<string, string> = {
  sent: 'text-[#1E9990]',
  failed: 'text-[#E84A4A]',
  skipped: 'text-[#9898B8]',
  pending: 'text-[#C4701E]',
}

function providerErrorSnippet(providerResponse: unknown): string | null {
  if (!providerResponse || typeof providerResponse !== 'object') return null
  const obj = providerResponse as Record<string, unknown>
  const msg =
    (typeof obj.message === 'string' && obj.message) ||
    (typeof obj.error === 'string' && obj.error) ||
    (typeof obj.detail === 'string' && obj.detail)
  return msg || null
}

export function notificationToLogEntry(row: {
  id: string
  channel: string
  event_type: string
  status: string
  recipient: string
  provider_response?: unknown
  sent_at: string
}): MessageLogEntry {
  const eventLabels: Record<string, string> = {
    application_received: 'Application received',
    otp_sent: 'OTP verification',
    status_changed: 'Application status update',
    app_fee_invoice_generated: 'Application fee invoice',
    tuition_invoice_generated: 'Tuition invoice',
    payment_confirmed: 'Payment confirmed (enrollment)',
    enrollment_confirmed: 'Enrollment confirmed',
    certificate_uploaded: 'Certificate uploaded',
    admission_letter_sent: 'Admission letter sent',
    password_reset: 'Password reset',
    contact_form: 'Contact form',
  }

  const providerDetail = providerErrorSnippet(row.provider_response)
  const detail =
    row.status === 'failed' || row.status === 'skipped' ? providerDetail : null

  return {
    id: `n-${row.id}`,
    source: 'notification',
    channel: row.channel,
    status: row.status,
    sentAt: row.sent_at,
    title: eventLabels[row.event_type] ?? row.event_type.replace(/_/g, ' '),
    body:
      detail ??
      (row.status === 'skipped'
        ? 'Not sent — messaging provider not configured'
        : `Automated ${row.channel} - ${row.event_type.replace(/_/g, ' ')}`),
    recipient: row.recipient,
    errorMessage: detail,
  }
}

export function communicationLogToEntry(row: {
  id: string
  channel: string
  status: string
  recipient: string
  error_message: string | null
  sent_at: string
  communication_campaigns: {
    subject: string | null
    message: string
    channel: string
  } | null
}): MessageLogEntry {
  const campaign = row.communication_campaigns
  const channel = row.channel || campaign?.channel || 'sms'
  const title = campaign?.subject?.trim() || 'Direct message'
  const body = campaign?.message?.trim() || '-'

  return {
    id: `c-${row.id}`,
    source: 'campaign',
    channel,
    status: row.status,
    sentAt: row.sent_at,
    title,
    body,
    recipient: row.recipient,
    errorMessage: row.error_message,
  }
}

interface MessageLogPanelProps {
  title: string
  subtitle?: string
  entries: MessageLogEntry[]
  emptyMessage?: string
  maxHeightClassName?: string
}

export default function MessageLogPanel({
  title,
  subtitle,
  entries,
  emptyMessage = 'No messages logged yet.',
  maxHeightClassName = 'max-h-[420px]',
}: MessageLogPanelProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  )

  return (
    <section className="rounded-xl bg-white p-6 shadow-card">
      <h2 className="font-body text-base font-semibold text-[#1A1A2E]">{title}</h2>
      {subtitle && (
        <p className="mt-1 font-body text-sm text-[#9898B8]">{subtitle}</p>
      )}

      {sorted.length === 0 ? (
        <p className="mt-4 font-body text-sm text-[#9898B8]">{emptyMessage}</p>
      ) : (
        <ul
          className={`mt-4 divide-y divide-[#EFEFF5] overflow-y-auto pr-1 ${maxHeightClassName}`}
        >
          {sorted.map((entry) => (
            <li key={entry.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-body text-xs font-semibold capitalize ${
                      CHANNEL_CLASS[entry.channel] ?? 'bg-[#F0F0F8] text-[#5A5A7A]'
                    }`}
                  >
                    {entry.channel}
                  </span>
                  <span className="rounded-full bg-[#F7F8FC] px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-[#9898B8]">
                    {entry.source === 'campaign' ? 'Campaign' : 'System'}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-body text-xs font-semibold capitalize ${
                      STATUS_CLASS[entry.status] ?? 'text-[#5A5A7A]'
                    }`}
                  >
                    {entry.status}
                  </span>
                  <p className="font-body text-xs text-[#9898B8]">
                    {formatPaymentDateTime(entry.sentAt)}
                  </p>
                </div>
              </div>

              <p className="mt-2 font-body text-sm font-semibold text-[#1A1A2E]">
                {entry.title}
              </p>
              <p className="mt-1 whitespace-pre-wrap font-body text-sm leading-relaxed text-[#5A5A7A]">
                {entry.body}
              </p>
              {entry.recipient && (
                <p className="mt-2 font-body text-xs text-[#9898B8]">
                  To: <span className="font-mono text-[#5A5A7A]">{entry.recipient}</span>
                </p>
              )}
              {entry.studentProfileHref && entry.studentName && (
                <p className="mt-2 font-body text-xs text-[#9898B8]">
                  Student:{' '}
                  <Link
                    href={entry.studentProfileHref}
                    className="font-semibold text-primary hover:underline"
                  >
                    {entry.studentName}
                  </Link>
                  {entry.studentPublicId && (
                    <span className="ml-1 font-mono text-[#9898B8]">
                      ({entry.studentPublicId})
                    </span>
                  )}
                </p>
              )}
              {entry.status === 'failed' && entry.errorMessage && (
                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-body text-xs text-red-700">
                  {entry.errorMessage}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
