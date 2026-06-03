import type { ReactNode } from 'react'
import type { Quote } from '@/lib/quotes'
import { MobileQuoteStrip } from './MobileQuoteStrip'
import { QuotePanel } from './QuotePanel'

interface AuthLayoutProps {
  children: ReactNode
  quote: Quote
  /** Lock to viewport height with no page scroll (portal and admin login). */
  viewportLocked?: boolean
}

export function AuthLayout({ children, quote, viewportLocked = false }: AuthLayoutProps) {
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

      <div
        style={{
          minHeight: '100vh',
          height: viewportLocked ? '100vh' : undefined,
          maxHeight: viewportLocked ? '100vh' : undefined,
          overflow: viewportLocked ? 'hidden' : undefined,
          display: 'flex',
        }}
      >
        <div
          className="quote-panel-desktop"
          style={{
            width: '55%',
            flexShrink: 0,
            height: viewportLocked ? '100%' : undefined,
          }}
        >
          <QuotePanel quote={quote} fullHeight={viewportLocked} />
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: '#F0F2F8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: viewportLocked ? '20px 24px' : '48px 32px',
            minHeight: viewportLocked ? undefined : '100vh',
            height: viewportLocked ? '100%' : undefined,
            overflow: viewportLocked ? 'hidden' : undefined,
          }}
        >
          <div style={{ width: '100%', maxWidth: '420px' }}>
            {children}

            {!viewportLocked ? (
              <div className="mobile-quote-strip">
                <MobileQuoteStrip quote={quote} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
