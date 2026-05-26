'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import MessageLogPanel, { type MessageLogEntry } from '@/components/admin/MessageLogPanel'

export type GlobalMessageLogRow = MessageLogEntry

interface AllMessageLogsClientProps {
  logs: GlobalMessageLogRow[]
}

export default function AllMessageLogsClient({ logs }: AllMessageLogsClientProps) {
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'sms' | 'whatsapp'>('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'sent' | 'failed' | 'pending' | 'skipped'
  >('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter((row) => {
      if (channelFilter !== 'all' && row.channel !== channelFilter) return false
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!q) return true
      return (
        row.title.toLowerCase().includes(q) ||
        row.body.toLowerCase().includes(q) ||
        (row.recipient?.toLowerCase().includes(q) ?? false) ||
        (row.studentName?.toLowerCase().includes(q) ?? false) ||
        (row.studentPublicId?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [logs, channelFilter, statusFilter, query])

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/admin/communications"
        className="mb-6 inline-block font-body text-sm text-[#9898B8] hover:text-[#1A1A2E]"
      >
        {'<'} Communications
      </Link>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Message log</h1>
          <p className="mt-1 font-body text-sm text-[#9898B8]">
            All outbound emails and SMS - campaigns and automated notifications. Failed sends show
            errors.
          </p>
        </div>
        <Link
          href="/admin/communications"
          className="font-body text-sm font-semibold text-primary hover:underline"
        >
          Send new campaign
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search student, recipient, or message…"
          className="min-w-[220px] flex-1 rounded-[10px] border border-[#D8D8E8] px-4 py-2.5 font-body text-sm"
        />
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
          className="rounded-[10px] border border-[#D8D8E8] px-3 py-2.5 font-body text-sm"
        >
          <option value="all">All channels</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-[10px] border border-[#D8D8E8] px-3 py-2.5 font-body text-sm"
        >
          <option value="all">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <MessageLogPanel
        title={`${filtered.length} message${filtered.length === 1 ? '' : 's'}`}
        entries={filtered}
        emptyMessage="No messages match your filters."
        maxHeightClassName="max-h-[calc(100vh-280px)]"
      />
    </div>
  )
}
