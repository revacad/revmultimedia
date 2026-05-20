interface LegalPageLayoutProps {
  title: string
  lastUpdated: string
  intro: string
  children: React.ReactNode
}

export function LegalPageLayout({
  title,
  lastUpdated,
  intro,
  children,
}: LegalPageLayoutProps) {
  return (
    <div style={{ padding: '0 0 80px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #2F2F52 100%)',
          padding: 'clamp(48px, 10vw, 80px) clamp(20px, 5vw, 48px) clamp(40px, 6vw, 64px)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            color: '#C74A86',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '16px',
          }}
        >
          Rev Multimedia Academy
        </p>
        <h1
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: 'clamp(36px, 6vw, 52px)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #ffffff 0%, #C74A86 60%, #F18F3B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '16px',
          }}
        >
          {lastUpdated}
        </p>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          {intro}
        </p>
      </div>

      <div
        style={{
          maxWidth: '780px',
          margin: '0 auto',
          padding: 'clamp(40px, 6vw, 64px) clamp(20px, 4vw, 32px) 0',
        }}
      >
        {children}
      </div>
    </div>
  )
}
