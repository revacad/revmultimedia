import { formatPaymentDateTime } from '@/lib/payments/format'

export type CommunicationLogHistoryRow = {
  id: string
  channel: string
  status: string
  sent_at: string
  communication_campaigns: {
    subject: string | null
    message: string
    channel: string
  } | null
}

const CHANNEL_CLASS: Record<string, string> = {
  email: 'bg-[#EBF0FD] text-[#4A7BE8]',
  sms: 'bg-[#FEF6EE] text-[#C4701E]',
  whatsapp: 'bg-[#EBF9F8] text-[#1E9990]',
}

export default function CommunicationHistoryCard({
  logs,
}: {
  logs: CommunicationLogHistoryRow[]
}) {
  return (
    <section className="mt-6 rounded-xl bg-white p-6 shadow-card">
      <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
        Communication History
      </h2>
      {logs.length === 0 ? (
        <p className="font-body text-sm text-[#9898B8]">No messages sent yet</p>
      ) : (
        <ul>
          {logs.map((row) => {
            const campaign = row.communication_campaigns
            const channel = row.channel || campaign?.channel || 'sms'
            const preview =
              campaign?.subject || campaign?.message || 'Message'

            return (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 border-b border-[#EFEFF5] py-3 last:border-0"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 font-body text-xs font-semibold capitalize ${
                      CHANNEL_CLASS[channel] ?? 'bg-[#F0F0F8] text-[#5A5A7A]'
                    }`}
                  >
                    {channel}
                  </span>
                  <p className="line-clamp-1 font-body text-sm text-[#1A1A2E]">
                    {preview}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`font-body text-xs font-semibold capitalize ${
                      row.status === 'sent' ? 'text-[#1E9990]' : 'text-[#9898B8]'
                    }`}
                  >
                    {row.status}
                  </span>
                  <p className="font-body text-xs text-[#9898B8]">
                    {formatPaymentDateTime(row.sent_at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
