import {
  INVOICE_STATUS_CLASS,
  INVOICE_STATUS_LABELS,
} from '@/lib/payments/status'
import type { InvoiceStatus } from '@/lib/payments/types'
import { cn } from '@/lib/utils'

export default function InvoiceStatusBadge({
  status,
  className,
}: {
  status: InvoiceStatus
  className?: string
}) {
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
