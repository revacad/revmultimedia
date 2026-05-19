import { STATUS_BADGE_CLASS, STATUS_LABELS } from '@/lib/applications/status'
import type { ApplicationStatus } from '@/lib/applications/types'
import { cn } from '@/lib/utils'

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export default function ApplicationStatusBadge({
  status,
  className,
}: ApplicationStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 font-body text-xs font-semibold',
        STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
