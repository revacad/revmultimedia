import type { InvoiceType } from '@/lib/payments/types'
import { cn } from '@/lib/utils'

const TYPE_CLASS: Record<InvoiceType, string> = {
  application_fee: 'bg-[#EBF0FD] text-[#4A7BE8]',
  tuition: 'bg-[#FDF0F6] text-[#C74A86]',
}

const TYPE_LABEL: Record<InvoiceType, string> = {
  application_fee: 'App Fee',
  tuition: 'Tuition',
}

export default function InvoiceTypeBadge({ type }: { type: InvoiceType }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 font-body text-xs font-semibold',
        TYPE_CLASS[type],
      )}
    >
      {TYPE_LABEL[type]}
    </span>
  )
}
