import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: '#1A1A2E',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div style={{ borderRadius: '50%', background: '#C74A86', width: 28, height: 28 }} />
          <div style={{ borderRadius: '50%', background: '#F18F3B', width: 28, height: 28 }} />
          <div style={{ borderRadius: '50%', background: '#2DBFB8', width: 28, height: 28 }} />
          <div
            style={{
              borderRadius: '50%',
              background: '#C74A86',
              opacity: 0.7,
              width: 28,
              height: 28,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            fontWeight: 700,
            color: 'white',
            letterSpacing: -0.5,
          }}
        >
          <span style={{ color: '#C74A86' }}>Rev</span>
          <span>Multimedia</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
