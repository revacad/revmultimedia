interface LegalSectionProps {
  number: string
  title: string
  children: React.ReactNode
}

export function LegalSection({ number, title, children }: LegalSectionProps) {
  return (
    <div style={{ marginBottom: '48px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #C74A86, #F18F3B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'Clash Display, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            {number}
          </span>
        </div>
        <h2
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '22px',
            fontWeight: 600,
            color: '#1A1A2E',
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      <div
        style={{
          paddingLeft: 'clamp(0px, 4vw, 52px)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '15px',
          color: '#5A5A7A',
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
      <div
        style={{
          height: '1px',
          backgroundColor: '#EFEFF5',
          marginTop: '48px',
        }}
      />
    </div>
  )
}
