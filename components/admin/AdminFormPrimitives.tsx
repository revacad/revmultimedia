import type { CSSProperties, ReactNode } from 'react'

export const adminLabelStyle: CSSProperties = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '13px',
  fontWeight: 600,
  color: '#5A5A7A',
  marginBottom: '6px',
  display: 'block',
}

export const adminFieldStyle: CSSProperties = {
  background: 'white',
  border: '1.5px solid #D8D8E8',
  borderRadius: '10px',
  padding: '12px 16px',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '15px',
  color: '#1A1A2E',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

export const adminFieldClassName =
  'admin-field w-full rounded-[10px] border-[1.5px] border-[#D8D8E8] bg-white px-4 py-3 font-body text-[15px] text-dark outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10'

export function AdminFormCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 2px 16px rgba(26,26,46,0.08)',
        border: '1px solid #EFEFF5',
        maxWidth: '800px',
      }}
    >
      {children}
    </div>
  )
}

export function AdminFormSection({
  title,
  children,
  isLast,
}: {
  title: string
  children: ReactNode
  isLast?: boolean
}) {
  return (
    <section
      style={{
        marginBottom: '32px',
        paddingBottom: isLast ? 0 : '32px',
        borderBottom: isLast ? 'none' : '1px solid #EFEFF5',
      }}
    >
      <h2
        style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: '18px',
          color: '#1A1A2E',
          marginBottom: '16px',
          fontWeight: 600,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function AdminLabel({
  htmlFor,
  children,
  helper,
}: {
  htmlFor?: string
  children: ReactNode
  helper?: string
}) {
  return (
    <div style={{ marginBottom: helper ? '4px' : undefined }}>
      <label htmlFor={htmlFor} style={adminLabelStyle}>
        {children}
      </label>
      {helper && (
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#9898B8',
            marginBottom: '6px',
          }}
        >
          {helper}
        </p>
      )}
    </div>
  )
}

export function AdminFieldGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}
    >
      {children}
    </div>
  )
}

export function AdminToggle({
  name,
  defaultChecked,
  label,
  helper,
}: {
  name: string
  defaultChecked?: boolean
  label: string
  helper?: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <div>
        <span style={{ ...adminLabelStyle, marginBottom: helper ? '4px' : '6px' }}>{label}</span>
        {helper && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#9898B8' }}>
            {helper}
          </p>
        )}
      </div>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-[#D8D8E8] transition-colors peer-checked:bg-[#C74A86] peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30" />
        <span className="absolute left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}
