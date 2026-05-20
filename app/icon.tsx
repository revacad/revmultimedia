import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#1A1A2E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
            width: 18,
            height: 18,
          }}
        >
          <div style={{ borderRadius: '50%', background: '#C74A86', width: 7, height: 7 }} />
          <div style={{ borderRadius: '50%', background: '#F18F3B', width: 7, height: 7 }} />
          <div style={{ borderRadius: '50%', background: '#2DBFB8', width: 7, height: 7 }} />
          <div
            style={{
              borderRadius: '50%',
              background: '#C74A86',
              opacity: 0.7,
              width: 7,
              height: 7,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
