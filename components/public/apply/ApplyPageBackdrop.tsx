'use client'

import Image from 'next/image'

/** Floating design-tool SVGs + background photo (homepage hero style). */
export default function ApplyPageBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <Image
        src="/images/apply-background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,248,252,0.72)_0%,rgba(247,248,252,0.78)_50%,rgba(240,242,248,0.82)_100%)]" />

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute right-[4%] top-[10%] opacity-[0.14] sm:opacity-[0.12]"
          style={{ animation: 'heroFloat1 9s ease-in-out infinite' }}
        >
          <svg
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C74A86"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </div>
        <div
          className="absolute left-[2%] top-[38%] hidden opacity-[0.12] sm:block"
          style={{ animation: 'heroFloat2 11s ease-in-out infinite 1.5s' }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2DBFB8"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div
          className="absolute bottom-[12%] right-[6%] opacity-[0.13] sm:opacity-[0.11]"
          style={{ animation: 'heroFloat3 13s ease-in-out infinite 3s' }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F18F3B"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        </div>
        <div
          className="absolute left-[3%] top-[8%] opacity-[0.1] sm:opacity-[0.09]"
          style={{ animation: 'heroFloat1 15s ease-in-out infinite 2s' }}
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C74A86"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </div>
        <div
          className="absolute bottom-[18%] left-[8%] hidden opacity-[0.1] md:block"
          style={{ animation: 'heroFloat2 12s ease-in-out infinite 0.8s' }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2DBFB8"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <div
          className="absolute right-[18%] top-[52%] hidden opacity-[0.09] lg:block"
          style={{ animation: 'heroFloat3 10s ease-in-out infinite 1.2s' }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F18F3B"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </div>
      </div>
    </div>
  )
}
