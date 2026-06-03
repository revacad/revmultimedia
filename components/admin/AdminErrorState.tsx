'use client'

import ErrorState from '@/components/ui/ErrorState'

interface AdminErrorStateProps {
  message: string
  onRetry?: () => void
  className?: string
}

export default function AdminErrorState({
  message,
  onRetry,
  className,
}: AdminErrorStateProps) {
  return (
    <ErrorState
      message={message}
      onRetry={onRetry}
      className={className}
      showWhatsApp={false}
    />
  )
}
