'use client'

import { useRouter } from 'next/navigation'
import { WHATSAPP_SUPPORT_URL } from '@/lib/support/whatsapp'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  message: string
  showWhatsApp?: boolean
  onRetry?: () => void
  className?: string
}

function WarningIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export default function ErrorState({
  message,
  showWhatsApp = true,
  onRetry,
  className,
}: ErrorStateProps) {
  const router = useRouter()

  function handleRetry() {
    if (onRetry) {
      onRetry()
      return
    }
    router.refresh()
  }

  return (
    <div
      className={cn(
        'mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <WarningIcon />
      </div>
      <p className="font-body text-sm leading-relaxed text-[#5A5A7A]">{message}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex rounded-full bg-[#C74A86] px-5 py-2 font-body text-sm font-semibold text-white hover:opacity-90"
        >
          Try again
        </button>
        {showWhatsApp ? (
          <a
            href={WHATSAPP_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-[#2DBFB8]/40 bg-white px-5 py-2 font-body text-sm font-semibold text-[#1E9990] hover:bg-[#EBF9F8]"
          >
            Chat with us
          </a>
        ) : null}
      </div>
    </div>
  )
}
