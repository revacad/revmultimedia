import { formatApplicationDate } from '@/lib/applications/format'

export type NotificationLogRow = {
  id: string
  channel: string
  event_type: string
  status: string
  sent_at: string
}

const CHANNEL_CLASS: Record<string, string> = {
  email: 'bg-[#EBF0FD] text-[#4A7BE8]',
  sms: 'bg-[#FEF6EE] text-[#C4701E]',
  whatsapp: 'bg-[#EBF9F8] text-[#1E9990]',
}

const EVENT_LABELS: Record<string, string> = {
  application_received: 'Application received',
  otp_sent: 'OTP sent',
  status_changed: 'Status changed',
  app_fee_invoice_generated: 'App fee invoice',
  tuition_invoice_generated: 'Tuition invoice',
  payment_confirmed: 'Payment confirmed',
  enrollment_confirmed: 'Enrollment confirmed',
  certificate_uploaded: 'Certificate uploaded',
  password_reset: 'Password reset',
  contact_form: 'Contact form',
}

export default function NotificationHistoryCard({
  notifications,
}: {
  notifications: NotificationLogRow[]
}) {
  return (
    <section className="mt-6 rounded-xl bg-white p-6 shadow-card">
      <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
        Notification History
      </h2>
      {notifications.length === 0 ? (
        <p className="font-body text-sm text-[#9898B8]">No notifications sent yet</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEFF5] pb-3 last:border-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-body text-xs font-semibold capitalize ${
                    CHANNEL_CLASS[row.channel] ?? 'bg-[#F0F0F8] text-[#5A5A7A]'
                  }`}
                >
                  {row.channel}
                </span>
                <span className="font-body text-sm text-[#1A1A2E]">
                  {EVENT_LABELS[row.event_type] ?? row.event_type}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`font-body text-xs font-semibold capitalize ${
                    row.status === 'sent' ? 'text-[#1E9990]' : 'text-[#9898B8]'
                  }`}
                >
                  {row.status}
                </span>
                <p className="font-body text-xs text-[#9898B8]">
                  {formatApplicationDate(row.sent_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
