'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Quote } from '@/lib/quotes'

function CreativeTools() {
  const toolsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadGSAP = async () => {
      const { gsap } = await import('gsap')

      const tools = toolsRef.current?.querySelectorAll('.floating-tool')
      tools?.forEach((tool, i) => {
        gsap.to(tool, {
          y: -12,
          duration: 3 + i * 0.7,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.5,
        })
        gsap.to(tool, {
          rotation: i % 2 === 0 ? 8 : -8,
          duration: 5 + i * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.3,
        })
      })
    }
    void loadGSAP()
  }, [])

  return (
    <div
      ref={toolsRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div className="floating-tool" style={{ position: 'absolute', top: '12%', right: '10%', opacity: 0.15 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      </div>
      <div className="floating-tool" style={{ position: 'absolute', top: '35%', left: '8%', opacity: 0.12 }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="4" cy="20" r="2" />
          <circle cx="20" cy="4" r="2" />
          <circle cx="20" cy="20" r="2" />
          <path d="M6 20 C6 12 14 8 18 6" />
          <path d="M20 6 C20 14 20 18 20 18" />
        </svg>
      </div>
      <div className="floating-tool" style={{ position: 'absolute', top: '8%', left: '15%', opacity: 0.1 }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>
      <div className="floating-tool" style={{ position: 'absolute', bottom: '20%', left: '10%', opacity: 0.12 }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      </div>
      <div className="floating-tool" style={{ position: 'absolute', bottom: '15%', right: '12%', opacity: 0.1 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
        </svg>
      </div>
      <div className="floating-tool" style={{ position: 'absolute', top: '22%', right: '25%', opacity: 0.08 }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      </div>
      <div className="floating-tool" style={{ position: 'absolute', top: '55%', right: '8%', opacity: 0.1 }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </div>
    </div>
  )
}

interface QuotePanelProps {
  quote: Quote
}

export function QuotePanel({ quote }: QuotePanelProps) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(145deg, #1A1A2E 0%, #2F2F52 60%, #1A1A2E 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        overflow: 'hidden',
        minHeight: '100vh',
      }}
    >
      <CreativeTools />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', width: '20px', height: '20px', gap: '3px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C74A86' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F18F3B' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2DBFB8' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C74A86', opacity: 0.6 }} />
          </div>
          <span style={{ fontFamily: 'Clash Display, sans-serif', fontSize: '16px', fontWeight: 700, color: 'white' }}>
            Rev<span style={{ fontWeight: 400 }}>Multimedia</span>
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 0',
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '96px',
            color: '#C74A86',
            lineHeight: 0.8,
            marginBottom: '24px',
            opacity: 0.6,
          }}
          aria-hidden
        >
          &ldquo;
        </div>

        <p
          style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '22px',
            fontWeight: 500,
            color: 'white',
            lineHeight: 1.5,
            marginBottom: '32px',
            maxWidth: '480px',
          }}
        >
          {quote.text}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(199,74,134,0.5)',
              flexShrink: 0,
            }}
          >
            <Image
              src={quote.image}
              alt={quote.name}
              width={48}
              height={48}
              sizes="48px"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>
              {quote.name}
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              {quote.title}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
