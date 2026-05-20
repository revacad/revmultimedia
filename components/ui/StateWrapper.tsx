import { LogoLoader } from './LogoLoader'

interface StateWrapperProps {
  loading: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyMessage?: string
  loadingText?: string
  children: React.ReactNode
  onRetry?: () => void
}

export function StateWrapper({
  loading,
  error,
  empty,
  emptyTitle,
  emptyMessage,
  loadingText,
  children,
  onRetry,
}: StateWrapperProps) {
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        <LogoLoader size="sm" text={loadingText} />
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: '#FDECEC',
          borderRadius: '14px',
          border: '1px solid rgba(232,74,74,0.20)',
        }}
      >
        <p
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '18px',
            color: '#1A1A2E',
            marginBottom: '8px',
          }}
        >
          Something went wrong
        </p>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#5A5A7A',
            marginBottom: '16px',
          }}
        >
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              backgroundColor: '#C74A86',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '9999px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 24px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#F7F8FC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9898B8" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '18px',
            color: '#1A1A2E',
            marginBottom: '6px',
          }}
        >
          {emptyTitle || 'Nothing here yet'}
        </p>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#9898B8',
          }}
        >
          {emptyMessage || 'Items will appear here when available.'}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
