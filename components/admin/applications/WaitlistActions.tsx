'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  moveWaitlistedToActive,
  notifyWaitlistedStudent,
} from '@/actions/waitlist'
import { formatApplicationDate } from '@/lib/applications/format'
import { cn } from '@/lib/utils'

interface WaitlistActionsProps {
  applicationId: string
  waitlistPosition: number | null
  waitlistNotifiedAt: string | null
}

export default function WaitlistActions({
  applicationId,
  waitlistPosition,
  waitlistNotifiedAt,
}: WaitlistActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleNotify() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await notifyWaitlistedStudent(applicationId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setSuccess('Student notified by email and SMS.')
      router.refresh()
    })
  }

  function handleMoveToActive() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await moveWaitlistedToActive(applicationId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setSuccess(
        result.invoiceReference
          ? `Moved to active. Application fee invoice ${result.invoiceReference} created.`
          : 'Moved to active.',
      )
      router.refresh()
    })
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-card">
      <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
        Waitlist
      </p>
      {waitlistPosition != null && (
        <p className="mt-2 font-display text-2xl font-semibold text-[#7B5AE8]">
          Position #{waitlistPosition}
        </p>
      )}
      {waitlistNotifiedAt && (
        <p className="mt-2 font-body text-xs text-[#9898B8]">
          Last notified {formatApplicationDate(waitlistNotifiedAt)}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-body text-xs text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg border border-[#2DBFB8]/30 bg-[#EBF9F8] px-3 py-2 font-body text-xs text-[#1E9990]">
          {success}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleNotify}
          className={cn(
            'rounded-lg border-[1.5px] border-[#7B5AE8]/30 bg-[#F3EEFF] px-4 py-2.5 font-body text-[13px] font-semibold text-[#7B5AE8] transition-colors hover:bg-[#E8DEFF] disabled:opacity-50',
          )}
        >
          Notify student
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleMoveToActive}
          className={cn(
            'rounded-lg border-[1.5px] border-[#2DBFB8]/30 bg-[#EBF9F8] px-4 py-2.5 font-body text-[13px] font-semibold text-[#1E9990] transition-colors hover:bg-[#D4F3F1] disabled:opacity-50',
          )}
        >
          Move to active
        </button>
      </div>
      <p className="mt-3 font-body text-xs text-[#9898B8]">
        Notify sends an email and SMS that a spot may be available. Move to active changes status
        to pending and generates the application fee invoice.
      </p>
    </section>
  )
}
