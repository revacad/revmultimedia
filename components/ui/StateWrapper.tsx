import { LogoLoader } from './LogoLoader'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { defaultLoadErrorMessage, isNetworkError, networkErrorMessage } from '@/lib/errors/network'

interface StateWrapperProps {
  loading: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  emptyAction?: { label: string; href?: string; onClick?: () => void }
  loadingText?: string
  children: React.ReactNode
  onRetry?: () => void
  showWhatsApp?: boolean
}

function DefaultEmptyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export function StateWrapper({
  loading,
  error,
  empty,
  emptyTitle,
  emptyMessage,
  emptyIcon,
  emptyAction,
  loadingText,
  children,
  onRetry,
  showWhatsApp = true,
}: StateWrapperProps) {
  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <LogoLoader size="sm" text={loadingText} />
      </div>
    )
  }

  if (error) {
    const message = isNetworkError(error)
      ? networkErrorMessage()
      : defaultLoadErrorMessage()

    return (
      <ErrorState
        message={message}
        onRetry={onRetry}
        showWhatsApp={showWhatsApp}
      />
    )
  }

  if (empty) {
    return (
      <EmptyState
        icon={emptyIcon ?? <DefaultEmptyIcon />}
        message={emptyTitle ?? 'Nothing here yet'}
        description={emptyMessage ?? 'Items will appear here when available.'}
        action={emptyAction}
      />
    )
  }

  return <>{children}</>
}
