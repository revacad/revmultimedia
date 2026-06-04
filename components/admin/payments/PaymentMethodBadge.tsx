import {
  paymentMethodBadgeClass,
  paymentMethodBadgeLabel,
} from '@/lib/payments/status'
import { cn } from '@/lib/utils'

export default function PaymentMethodBadge({
  method,
  className,
}: {
  method: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 font-body text-xs font-semibold',
        paymentMethodBadgeClass(method),
        className,
      )}
    >
      {paymentMethodBadgeLabel(method)}
    </span>
  )
}
