import Image from 'next/image'
import type { Quote } from '@/lib/quotes'

interface MobileQuoteStripProps {
  quote: Quote
}

export function MobileQuoteStrip({ quote }: MobileQuoteStripProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1A1A2E, #2F2F52)',
        borderRadius: '20px',
        padding: '28px 24px',
        margin: '24px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '20px',
          opacity: 0.25,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <circle cx="11" cy="11" r="2" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </div>

      <p
        style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: '15px',
          fontWeight: 500,
          color: 'white',
          lineHeight: 1.6,
          marginBottom: '16px',
        }}
      >
        &ldquo;{quote.text}&rdquo;
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(199,74,134,0.5)',
            flexShrink: 0,
          }}
        >
          <Image
            src={quote.image}
            alt={quote.name}
            width={36}
            height={36}
            sizes="36px"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 700, color: 'white' }}>
            {quote.name}
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            {quote.title}
          </p>
        </div>
      </div>
    </div>
  )
}
