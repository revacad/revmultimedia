'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F0F2F8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
        <h2
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '24px',
            color: '#1A1A2E',
            marginBottom: '8px',
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            color: '#5A5A7A',
            marginBottom: '24px',
          }}
        >
          We encountered an unexpected error. Our team has been notified.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            backgroundColor: '#C74A86',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '9999px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
