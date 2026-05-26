import type { InvoiceType } from '@/lib/payments/types'
import { paymentTypeLabelFromSlug } from '@/lib/payments/payment-types'
import { cn } from '@/lib/utils'

const TYPE_CLASS: Record<string, string> = {
  application_fee: 'bg-[#EBF0FD] text-[#4A7BE8]',
  tuition: 'bg-[#FDF0F6] text-[#C74A86]',
}

const DEFAULT_CLASS = 'bg-[#F0F0F5] text-[#5A5A7A]'

const TYPE_LABEL: Record<InvoiceType, string> = {
  application_fee: 'App Fee',
  tuition: 'Tuition',
}

export default function InvoiceTypeBadge({
  type,
  label,
}: {
  type: string
  label?: string | null
}) {
  const text =
    label ??
    (type in TYPE_LABEL ? TYPE_LABEL[type as InvoiceType] : paymentTypeLabelFromSlug(type))

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 font-body text-xs font-semibold',
        TYPE_CLASS[type] ?? DEFAULT_CLASS,
      )}
    >
      {text}
    </span>
  )
}
