import type { ReactNode } from 'react'

const bodyStyle = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '15px',
  color: '#5A5A7A',
  lineHeight: 1.8,
  margin: '0 0 12px',
} as const

export function LegalP({ children }: { children: ReactNode }) {
  return <p style={bodyStyle}>{children}</p>
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleColor: '#C74A86' }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: '8px', color: '#5A5A7A' }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

export function LegalHighlight({
  label = 'Important',
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <div
      style={{
        backgroundColor: '#FDF0F6',
        border: '1.5px solid rgba(199,74,134,0.20)',
        borderRadius: '12px',
        padding: '20px 24px',
        margin: '20px 0',
      }}
    >
      <p
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#C74A86',
          fontWeight: 600,
          margin: '0 0 8px',
        }}
      >
        {label}
      </p>
      <div
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          color: '#5A5A7A',
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {children}
      </div>
    </div>
  )
}
