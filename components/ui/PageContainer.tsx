export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F0F2F8',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1320px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '32px',
          boxShadow:
            '0 8px 40px rgba(26, 26, 46, 0.12), 0 2px 12px rgba(26, 26, 46, 0.08)',
          /* Do not use overflow:hidden — it clips navbar/CTA at rounded corners */
          minHeight: 'calc(100vh - 48px)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
