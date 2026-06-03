import {
  INVOICE_STATUS_CLASS,
  INVOICE_STATUS_LABELS,
} from '@/lib/payments/status'
import { isOverdue } from '@/lib/payments/format'
import type { InvoiceStatus } from '@/lib/payments/types'
import { cn } from '@/lib/utils'

export default function InvoiceStatusBadge({
  status,
  dueDate = null,
  className,
}: {
  status: InvoiceStatus
  dueDate?: string | null
  className?: string
}) {
  const overdue = isOverdue(dueDate, status)

  if (overdue) {
    return (
      <span
        className={cn(
          'inline-flex rounded-full bg-[#FDECEC] px-3 py-1 font-body text-xs font-semibold text-[#E84A4A]',
          className,
        )}
      >
        Overdue
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 font-body text-xs font-semibold',
        INVOICE_STATUS_CLASS[status],
        className,
      )}
    >
      {INVOICE_STATUS_LABELS[status]}
    </span>
  )
}
