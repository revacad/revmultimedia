'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateApplicationStatus } from '@/actions/application'
import type { ApplicationStatus } from '@/lib/applications/types'
import { cn } from '@/lib/utils'

const ACTIONS: {
  label: string
  status: ApplicationStatus
  className: string
  hoverClassName: string
  requiresAppFee?: boolean
}[] = [
  {
    label: 'Shortlist',
    status: 'shortlisted',
    className: 'border-[#F18F3B]/30 bg-[#FEF6EE] text-[#C4701E]',
    hoverClassName: 'hover:bg-[#FDE8D4]',
  },
  {
    label: 'Accept',
    status: 'accepted',
    className: 'border-[#2DBFB8]/30 bg-[#EBF9F8] text-[#1E9990]',
    hoverClassName: 'hover:bg-[#D4F3F1]',
    requiresAppFee: true,
  },
  {
    label: 'Reject',
    status: 'rejected',
    className: 'border-[#E84A4A]/30 bg-[#FDECEC] text-[#E84A4A]',
    hoverClassName: 'hover:bg-[#FAD4D4]',
  },
  {
    label: 'Defer',
    status: 'deferred',
    className: 'border-[#C74A86]/30 bg-[#FDF0F6] text-[#C74A86]',
    hoverClassName: 'hover:bg-[#F9E0EC]',
  },
  {
    label: 'Request Info',
    status: 'under_review',
    className: 'border-[#D8D8E8] bg-[#F7F8FC] text-[#5A5A7A]',
    hoverClassName: 'hover:bg-[#EEF0F8]',
  },
]

interface StatusActionButtonsProps {
  applicationId: string
  appFeePaid: boolean
  currentStatus: ApplicationStatus
  isEnrolled: boolean
}

function isActionDisabled(
  action: (typeof ACTIONS)[number],
  currentStatus: ApplicationStatus,
  isEnrolled: boolean,
  appFeePaid: boolean,
  pending: boolean,
): boolean {
  if (pending) return true
  if (isEnrolled) return true
  if (action.requiresAppFee && !appFeePaid) return true
  if (action.status === 'accepted' && currentStatus === 'accepted') return true
  if (action.status === 'rejected' && currentStatus === 'rejected') return true
  if (action.status === 'shortlisted' && currentStatus === 'shortlisted') return true
  return false
}

export default function StatusActionButtons({
  applicationId,
  appFeePaid,
  currentStatus,
  isEnrolled,
}: StatusActionButtonsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleStatus(status: ApplicationStatus) {
    setError(null)
    startTransition(async () => {
      const result = await updateApplicationStatus(applicationId, status)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-body text-xs text-red-600">
          {error}
        </p>
      )}
      {isEnrolled ? (
        <p className="mb-3 font-body text-xs text-[#5A5A7A]">
          This student is enrolled. Status cannot be changed.
        </p>
      ) : (
        !appFeePaid && (
          <p className="mb-3 font-body text-xs text-[#9898B8]">
            Accept is available after the application fee is paid. Tuition invoice is sent
            automatically on accept.
          </p>
        )
      )}
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((action) => {
          const disabled = isActionDisabled(
            action,
            currentStatus,
            isEnrolled,
            appFeePaid,
            pending,
          )
          return (
            <button
              key={action.label}
              type="button"
              disabled={disabled}
              title={
                action.requiresAppFee && !appFeePaid && !isEnrolled
                  ? 'Application fee must be paid first'
                  : undefined
              }
              onClick={() => handleStatus(action.status)}
              className={cn(
                'rounded-lg border-[1.5px] px-3 py-2 font-body text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                action.className,
                !disabled && action.hoverClassName,
              )}
            >
              {action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
