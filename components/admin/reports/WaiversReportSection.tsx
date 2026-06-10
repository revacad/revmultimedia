'use client'

import { useMemo, useState } from 'react'
import { formatGHS } from '@/lib/utils'
import { formatPaymentDateTime } from '@/lib/payments/format'
import type { WaiverReportRow } from '@/lib/payments/fetch-waiver-report'

interface WaiversReportSectionProps {
  rows: WaiverReportRow[]
  totalGhs: number
}

export default function WaiversReportSection({ rows, totalGhs }: WaiversReportSectionProps) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const paidAt = new Date(row.paidAt).getTime()
      if (fromDate) {
        const from = new Date(fromDate).getTime()
        if (paidAt < from) return false
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`).getTime()
        if (paidAt > to) return false
      }
      return true
    })
  }, [rows, fromDate, toDate])

  const filteredTotal = filteredRows.reduce((sum, row) => sum + row.amountGhs, 0)

  if (rows.length === 0) {
    return null
  }

  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-body text-base font-semibold text-[#1A1A2E]">Waivers</h2>
          <p className="mt-1 font-body text-sm text-[#9898B8]">
            Total waived: {formatGHS(filteredTotal)} ({filteredRows.length} records)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="font-body text-xs text-[#9898B8]">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 block rounded-lg border border-[#EFEFF5] px-3 py-2 font-body text-sm text-[#1A1A2E]"
            />
          </label>
          <label className="font-body text-xs text-[#9898B8]">
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 block rounded-lg border border-[#EFEFF5] px-3 py-2 font-body text-sm text-[#1A1A2E]"
            />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full font-body text-sm">
          <thead>
            <tr className="border-b border-[#EFEFF5] text-left text-xs uppercase tracking-wide text-[#9898B8]">
              <th className="px-2 py-2">Invoice</th>
              <th className="px-2 py-2">Student</th>
              <th className="px-2 py-2">Amount</th>
              <th className="px-2 py-2">Reason</th>
              <th className="px-2 py-2">Applied by</th>
              <th className="px-2 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="border-b border-[#EFEFF5] last:border-0">
                <td className="px-2 py-3 font-mono text-[#C74A86]">{row.invoiceRef}</td>
                <td className="px-2 py-3 text-[#1A1A2E]">{row.studentName}</td>
                <td className="px-2 py-3 font-semibold text-[#1A1A2E]">{formatGHS(row.amountGhs)}</td>
                <td className="px-2 py-3 text-[#5A5A7A]">{row.waiverReason}</td>
                <td className="px-2 py-3 text-[#5A5A7A]">{row.adminName}</td>
                <td className="px-2 py-3 text-[#9898B8]">{formatPaymentDateTime(row.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRows.length === 0 && (
        <p className="mt-4 font-body text-sm text-[#9898B8]">
          No waivers match the selected date range.
        </p>
      )}

      {filteredRows.length > 0 && filteredTotal !== totalGhs && (
        <p className="mt-3 font-body text-xs text-[#9898B8]">
          All-time waivers in this report period: {formatGHS(totalGhs)}
        </p>
      )}
    </section>
  )
}
