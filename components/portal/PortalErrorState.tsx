'use client'

import { useRouter } from 'next/navigation'
import { WHATSAPP_SUPPORT_URL } from '@/lib/support/whatsapp'
import { cn } from '@/lib/utils'

interface PortalErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
  variant?: 'page' | 'inline'
}

function RevLogoMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dotSize = size === 'sm' ? 6 : 8
  const gap = size === 'sm' ? 3 : 4

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(2, ${dotSize}px)`,
          gap: `${gap}px`,
        }}
        aria-hidden
      >
        {['#C74A86', '#F18F3B', '#2DBFB8', '#C74A86'].map((color, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{ width: dotSize, height: dotSize, backgroundColor: color }}
          />
        ))}
      </div>
      <p className="font-display text-xl font-bold text-[#C74A86] sm:text-2xl">
        Rev <span className="font-semibold text-[#1A1A2E]">Multimedia</span>
      </p>
    </div>
  )
}

export default function PortalErrorState({
  title = 'Something went wrong',
  message = 'We could not load your dashboard. This is usually a connection issue.',
  onRetry,
  className,
  variant = 'page',
}: PortalErrorStateProps) {
  const router = useRouter()

  function handleRetry() {
    if (onRetry) {
      onRetry()
      return
    }
    router.refresh()
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'mt-3 w-full max-w-md rounded-lg border border-[#E84A4A]/20 bg-[#FDECEC] px-4 py-4 text-center',
          className,
        )}
      >
        <p className="font-body text-sm font-semibold text-[#1A1A2E]">{title}</p>
        <p className="mt-1 font-body text-xs leading-relaxed text-[#5A5A7A]">{message}</p>
        <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex rounded-full bg-[#C74A86] px-4 py-2 font-body text-xs font-semibold text-white hover:opacity-90"
          >
            Try again
          </button>
          <a
            href={WHATSAPP_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-[#2DBFB8]/40 bg-white px-4 py-2 font-body text-xs font-semibold text-[#1E9990] hover:bg-[#EBF9F8]"
          >
            Chat with support
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-md flex-col items-center rounded-2xl bg-white px-8 py-12 text-center shadow-card',
        className,
      )}
    >
      <RevLogoMark />
      <h1 className="mt-8 font-display text-2xl font-semibold text-[#1A1A2E]">{title}</h1>
      <p className="mt-3 font-body text-sm leading-relaxed text-[#5A5A7A]">{message}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex justify-center rounded-full bg-[#C74A86] px-6 py-3 font-body text-sm font-semibold text-white hover:opacity-90"
        >
          Try again
        </button>
        <a
          href={WHATSAPP_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex justify-center rounded-full border border-[#2DBFB8]/40 bg-white px-6 py-3 font-body text-sm font-semibold text-[#1E9990] hover:bg-[#EBF9F8]"
        >
          Chat with support
        </a>
      </div>
    </div>
  )
}
