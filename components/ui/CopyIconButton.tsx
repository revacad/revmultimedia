'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { copyTextToClipboard } from '@/lib/clipboard'

interface CopyIconButtonProps {
  text: string
  className?: string
  iconClassName?: string
  showCopiedLabel?: boolean
}

export default function CopyIconButton({
  text,
  className,
  iconClassName,
  showCopiedLabel = true,
}: CopyIconButtonProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCopy() {
    copyTextToClipboard(text).then((ok) => {
      if (!ok) return
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setCopied(true)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#9898B8] transition-colors hover:bg-[#F7F8FC] hover:text-[#C74A86]',
          className,
        )}
        aria-label={copied ? 'Copied' : 'Copy'}
        title={copied ? 'Copied!' : 'Copy'}
      >
        {copied ? (
          <svg
            className={cn('h-3.5 w-3.5 text-[#1E9990]', iconClassName)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg
            className={cn('h-3.5 w-3.5', iconClassName)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
      {showCopiedLabel && copied && (
        <span className="font-body text-xs font-medium text-[#1E9990]" role="status">
          Copied!
        </span>
      )}
    </span>
  )
}
