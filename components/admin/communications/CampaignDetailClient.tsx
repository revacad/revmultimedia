'use client'

import Link from 'next/link'
import { formatPaymentDateTime } from '@/lib/payments/format'
import type { CommunicationChannel } from '@/lib/messaging/types'

export type CommunicationLogRow = {
  id: string
  recipient: string
  channel: CommunicationChannel
  status: string
  error_message: string | null
  sent_at: string
  students: { full_name: string; student_id: string } | null
}

export type CampaignDetail = {
  id: string
  channel: CommunicationChannel
  subject: string | null
  message: string
  recipient_count: number
  sent_count: number
  failed_count: number
  status: string
  created_at: string
  completed_at: string | null
  admins: { full_name: string } | null
}

const CHANNEL_CLASS: Record<string, string> = {
  email: 'bg-[#EBF0FD] text-[#4A7BE8]',
  sms: 'bg-[#FEF6EE] text-[#C4701E]',
  whatsapp: 'bg-[#EBF9F8] text-[#1E9990]',
}

export default function CampaignDetailClient({
  campaign,
  logs,
}: {
  campaign: CampaignDetail
  logs: CommunicationLogRow[]
}) {
  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/admin/communications"
        className="mb-6 inline-block font-body text-sm text-[#9898B8] hover:text-[#1A1A2E]"
      >
        {'<'} Communications
      </Link>

      <header className="mb-8 rounded-xl bg-white p-6 shadow-card">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 font-body text-xs font-semibold capitalize ${
              CHANNEL_CLASS[campaign.channel] ?? 'bg-[#F0F0F8] text-[#5A5A7A]'
            }`}
          >
            {campaign.channel}
          </span>
          <span className="rounded-full bg-[#F0F0F8] px-2.5 py-0.5 font-body text-xs font-semibold capitalize text-[#5A5A7A]">
            {campaign.status}
          </span>
        </div>
        {campaign.subject && (
          <h1 className="font-display text-xl font-semibold text-[#1A1A2E]">
            {campaign.subject}
          </h1>
        )}
        <p className="mt-2 whitespace-pre-wrap font-body text-sm text-[#5A5A7A]">
          {campaign.message}
        </p>
        <p className="mt-4 font-body text-xs text-[#9898B8]">
          {campaign.sent_count}/{campaign.recipient_count} sent
          {campaign.failed_count > 0 ? ` · ${campaign.failed_count} failed` : ''}
          {campaign.admins?.full_name ? ` · ${campaign.admins.full_name}` : ''}
          {' · '}
          {formatPaymentDateTime(campaign.created_at)}
          {campaign.completed_at
            ? ` · Completed ${formatPaymentDateTime(campaign.completed_at)}`
            : ''}
        </p>
      </header>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
          Delivery logs
        </h2>
        {logs.length === 0 ? (
          <p className="font-body text-sm text-[#9898B8]">No logs yet.</p>
        ) : (
          <ul>
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEFF5] py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-body text-sm font-medium text-[#1A1A2E]">
                    {log.students?.full_name ?? log.recipient}
                    {log.students?.student_id && (
                      <span className="ml-2 font-mono text-xs text-primary">
                        {log.students.student_id}
                      </span>
                    )}
                  </p>
                  <p className="font-body text-xs text-[#9898B8]">{log.recipient}</p>
                  {log.error_message && (
                    <p className="mt-1 font-body text-xs text-[#E84A4A]">{log.error_message}</p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`font-body text-xs font-semibold capitalize ${
                      log.status === 'sent' ? 'text-[#1E9990]' : 'text-[#E84A4A]'
                    }`}
                  >
                    {log.status}
                  </span>
                  <p className="font-body text-xs text-[#9898B8]">
                    {formatPaymentDateTime(log.sent_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
