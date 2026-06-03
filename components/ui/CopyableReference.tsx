'use client'

import { cn } from '@/lib/utils'
import CopyIconButton from '@/components/ui/CopyIconButton'

interface CopyableReferenceProps {
  reference: string
  className?: string
  monoClassName?: string
}

export default function CopyableReference({
  reference,
  className,
  monoClassName,
}: CopyableReferenceProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('font-mono text-sm font-medium text-[#C74A86]', monoClassName)}>
        {reference}
      </span>
      <CopyIconButton text={reference} />
    </span>
  )
}
