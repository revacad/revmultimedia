'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateApplicationStatus } from '@/actions/application'
import type { ApplicationStatus } from '@/lib/applications/types'
import { cn } from '@/lib/utils'

const ACTIONS: {
  label: string
  status: ApplicationStatus
  className: string
  hoverClassName: string
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
}

export default function StatusActionButtons({ applicationId }: StatusActionButtonsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleStatus(status: ApplicationStatus) {
    startTransition(async () => {
      const result = await updateApplicationStatus(applicationId, status)
      if ('success' in result && result.success) {
        router.refresh()
      }
    })
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          disabled={pending}
          onClick={() => handleStatus(action.status)}
          className={cn(
            'rounded-lg border-[1.5px] px-3 py-2 font-body text-[13px] font-semibold transition-colors disabled:opacity-50',
            action.className,
            action.hoverClassName,
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
