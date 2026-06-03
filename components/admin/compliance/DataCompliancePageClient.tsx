'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import {
  completeAccountDeletion,
  rejectAccountDeletion,
} from '@/actions/account-deletion'
import { formatApplicationDate } from '@/lib/applications/format'

export type DeletionRequestRow = {
  id: string
  student_name: string
  student_email: string
  requested_at: string
}

type DataCompliancePageClientProps = {
  requests: DeletionRequestRow[]
}

export default function DataCompliancePageClient({
  requests,
}: DataCompliancePageClientProps) {
  const router = useRouter()
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleComplete(requestId: string) {
    if (
      !window.confirm(
        'Permanently delete this student account and all associated data? This cannot be undone.',
      )
    ) {
      return
    }

    setLoadingId(requestId)
    setError(null)

    const result = await completeAccountDeletion(requestId)
    setLoadingId(null)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  async function handleReject(requestId: string) {
    const trimmed = rejectReason.trim()
    if (!trimmed) {
      setError('Please enter a reason for rejection.')
      return
    }

    setLoadingId(requestId)
    setError(null)

    const result = await rejectAccountDeletion(requestId, trimmed)
    setLoadingId(null)

    if (!result.success) {
      setError(result.error)
      return
    }

    setActiveRejectId(null)
    setRejectReason('')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E] sm:text-[28px]">
          Data & Compliance
        </h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Process student account and data deletion requests (Ghana Data
          Protection Act — 30-day processing window).
        </p>
      </header>

      {error ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <section className="rounded-xl border border-[#EFEFF5] bg-white shadow-card">
        <div className="border-b border-[#EFEFF5] px-5 py-4">
          <h2 className="font-body text-lg font-semibold text-[#1A1A2E]">
            Pending deletion requests
          </h2>
        </div>

        {requests.length === 0 ? (
          <p className="px-5 py-8 font-body text-sm text-[#9898B8]">
            No pending requests.
          </p>
        ) : (
          <ul className="divide-y divide-[#EFEFF5]">
            {requests.map((request) => (
              <li key={request.id} className="px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-[15px] font-semibold text-[#1A1A2E]">
                      {request.student_name}
                    </p>
                    <p className="font-body text-sm text-[#5A5A7A]">
                      {request.student_email}
                    </p>
                    <p className="mt-1 font-body text-xs text-[#9898B8]">
                      Requested {formatApplicationDate(request.requested_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      className="bg-red-600 hover:bg-red-700"
                      disabled={loadingId === request.id}
                      onClick={() => handleComplete(request.id)}
                    >
                      {loadingId === request.id
                        ? 'Processing…'
                        : 'Complete deletion'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={loadingId === request.id}
                      onClick={() => {
                        setError(null)
                        setActiveRejectId(
                          activeRejectId === request.id ? null : request.id,
                        )
                        setRejectReason('')
                      }}
                    >
                      Reject with reason
                    </Button>
                  </div>
                </div>

                {activeRejectId === request.id ? (
                  <div className="mt-4 space-y-3 rounded-[10px] border border-[#EFEFF5] bg-[#F7F8FC] p-4">
                    <label className="block font-body text-sm font-medium text-[#1A1A2E]">
                      Reason for rejection
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-[10px] border border-[#EFEFF5] px-3 py-2 font-body text-sm text-[#1A1A2E] outline-none focus:border-[#C74A86] focus:ring-2 focus:ring-[#C74A86]/20"
                        placeholder="Explain why this request cannot be completed…"
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setActiveRejectId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        disabled={loadingId === request.id}
                        onClick={() => handleReject(request.id)}
                      >
                        Confirm rejection
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
