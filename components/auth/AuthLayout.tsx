import type { ReactNode } from 'react'
import type { Quote } from '@/lib/quotes'
import { MobileQuoteStrip } from './MobileQuoteStrip'
import { QuotePanel } from './QuotePanel'

interface AuthLayoutProps {
  children: ReactNode
  quote: Quote
}

export function AuthLayout({ children, quote }: AuthLayoutProps) {
  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          .quote-panel-desktop { display: none !important; }
        }
        @media (min-width: 1024px) {
          .mobile-quote-strip { display: none !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex' }}>
        <div className="quote-panel-desktop" style={{ width: '55%', flexShrink: 0 }}>
          <QuotePanel quote={quote} />
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: '#F0F2F8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 32px',
            minHeight: '100vh',
          }}
        >
          <div style={{ width: '100%', maxWidth: '420px' }}>
            {children}

            <div className="mobile-quote-strip">
              <MobileQuoteStrip quote={quote} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
