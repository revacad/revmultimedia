export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F0F2F8',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1320px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '32px',
          boxShadow: '0 8px 40px rgba(26,26,46,0.12)',
          minHeight: 'calc(100vh - 32px)',
          overflow: 'clip',
        }}
        className={className}
      >
        {children}
      </div>
    </div>
  )
}
