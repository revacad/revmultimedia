import Link from 'next/link'
import type { ReactNode } from 'react'

interface AuthPageShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footerNote?: string
}

export default function AuthPageShell({ title, subtitle, children, footerNote }: AuthPageShellProps) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
          <span
            style={{
              fontFamily: 'Clash Display, sans-serif',
              fontWeight: 700,
              fontSize: '24px',
              color: '#C74A86',
            }}
          >
            Rev
          </span>
          <span
            style={{
              fontFamily: 'Clash Display, sans-serif',
              fontWeight: 600,
              fontSize: '24px',
              color: '#1A1A2E',
            }}
          >
            Multimedia
          </span>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(26,26,46,0.10)',
          border: '1px solid #EFEFF5',
        }}
      >
        <h1
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '28px',
            fontWeight: 700,
            color: '#1A1A2E',
            marginBottom: '8px',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            color: '#9898B8',
            marginBottom: '32px',
          }}
        >
          {subtitle}
        </p>
        {children}
        {footerNote && (
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: '#9898B8',
              textAlign: 'center',
              marginTop: '24px',
            }}
          >
            {footerNote}
          </p>
        )}
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: '24px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#9898B8',
        }}
      >
        <Link href="/" style={{ color: '#C74A86' }}>
          ← Back to Rev Multimedia
        </Link>
      </p>
    </>
  )
}
