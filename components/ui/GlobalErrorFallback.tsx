'use client'

import Link from 'next/link'
import { WHATSAPP_SUPPORT_URL } from '@/lib/support/whatsapp'

interface GlobalErrorFallbackProps {
  onRetry?: () => void
  title?: string
  message?: string
}

export default function GlobalErrorFallback({
  onRetry,
  title = 'Something went wrong',
  message = 'We hit an unexpected problem. Please try again, or contact us if this keeps happening.',
}: GlobalErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F2F8] px-6 py-16">
      <div className="mx-auto max-w-md rounded-xl border border-[#EFEFF5] bg-white px-6 py-10 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FDECEC] text-[#E84A4A]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-semibold text-[#1A1A2E]">{title}</h1>
        <p className="mt-3 font-body text-sm leading-relaxed text-[#5A5A7A]">{message}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-full bg-[#C74A86] px-5 py-2 font-body text-sm font-semibold text-white hover:opacity-90"
            >
              Try again
            </button>
          ) : null}
          <Link
            href="/"
            className="inline-flex rounded-full border border-[#EFEFF5] bg-white px-5 py-2 font-body text-sm font-semibold text-[#1A1A2E] hover:bg-[#F7F8FC]"
          >
            Go home
          </Link>
          <a
            href={WHATSAPP_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-[#2DBFB8]/40 bg-white px-5 py-2 font-body text-sm font-semibold text-[#1E9990] hover:bg-[#EBF9F8]"
          >
            Chat with us
          </a>
        </div>
      </div>
    </div>
  )
}
