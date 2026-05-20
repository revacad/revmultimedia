'use client'

interface LogoLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  text?: string
  variant?: 'light' | 'admin'
  /** Dark background and light text (e.g. PWA splash) */
  dark?: boolean
}

export function LogoLoader({
  size = 'md',
  fullScreen = false,
  text,
  variant = 'light',
  dark = false,
}: LogoLoaderProps) {
  const isDark = dark || variant === 'admin'
  const dotSize = size === 'sm' ? 6 : size === 'md' ? 8 : 12
  const fontSize = size === 'sm' ? 16 : size === 'md' ? 22 : 32
  const gap = size === 'sm' ? 3 : size === 'md' ? 4 : 6

  const wrapper = fullScreen
    ? {
        position: 'fixed' as const,
        inset: 0,
        backgroundColor: isDark ? 'rgba(26,26,46,0.95)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'sm' ? '16px' : '32px',
      }

  const multimediaColor = isDark ? '#FFFFFF' : '#1A1A2E'
  const textColor = isDark ? 'rgba(255,255,255,0.6)' : '#9898B8'

  return (
    <div style={wrapper} role="status" aria-live="polite" aria-busy="true">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'logoPulse 2s ease-in-out infinite',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(2, ${dotSize}px)`,
            gap: `${gap}px`,
          }}
        >
          {[
            { color: '#C74A86', delay: '0s' },
            { color: '#F18F3B', delay: '0.15s' },
            { color: '#2DBFB8', delay: '0.30s' },
            { color: '#C74A86', delay: '0.45s' },
          ].map((dot, i) => (
            <div
              key={i}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                backgroundColor: dot.color,
                animation: `dotPulse 1.2s ease-in-out ${dot.delay} infinite`,
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily: 'Clash Display, sans-serif',
              fontWeight: 700,
              fontSize,
              color: '#C74A86',
              animation: 'slideInLeft 0.5s ease-out forwards',
            }}
          >
            Rev
          </span>
          <span
            style={{
              fontFamily: 'Clash Display, sans-serif',
              fontWeight: 600,
              fontSize,
              color: multimediaColor,
              animation: 'slideInRight 0.5s ease-out 0.2s both',
            }}
          >
            Multimedia
          </span>
        </div>
      </div>

      {text && (
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: textColor,
            marginTop: '12px',
            animation: 'fadeIn 0.5s ease-out 0.4s both',
          }}
        >
          {text}
        </p>
      )}
    </div>
  )
}
