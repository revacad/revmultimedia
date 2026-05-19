'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ReferenceCodeProps {
  code: string
  label?: string
  className?: string
  theme?: 'dark' | 'light'
  large?: boolean
}

export default function ReferenceCode({
  code,
  label,
  className,
  theme = 'dark',
  large = false,
}: ReferenceCodeProps) {
  const [copied, setCopied] = useState(false)
  const isLight = theme === 'light'

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span
          className={cn(
            'text-xs font-medium uppercase tracking-wide',
            isLight ? 'text-[#9898B8]' : 'text-white/40',
          )}
        >
          {label}
        </span>
      )}
      <div
        className={cn(
          'inline-flex w-fit cursor-pointer items-center gap-3 rounded-sm border px-3.5 py-2 transition-colors',
          large && 'px-4 py-3',
          isLight
            ? 'border-[#C74A86]/25 bg-[#FDF0F6] hover:bg-[#FDF0F6]/80'
            : 'border-accent/25 bg-accent/8 hover:bg-accent/12',
        )}
        onClick={copyToClipboard}
      >
        <span
          className={cn(
            'font-mono font-medium',
            large ? 'text-base' : 'text-sm',
            isLight ? 'text-[#C74A86]' : 'text-accent',
          )}
        >
          {code}
        </span>
        <svg
          className={cn(
            'h-4 w-4 transition-colors',
            copied
              ? isLight
                ? 'text-[#C74A86]'
                : 'text-accent'
              : isLight
                ? 'text-[#C74A86]/60'
                : 'text-accent/60',
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {copied ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          )}
        </svg>
      </div>
    </div>
  )
}
