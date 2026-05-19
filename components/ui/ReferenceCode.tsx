'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ReferenceCodeProps {
  code: string
  label?: string
  className?: string
}

export default function ReferenceCode({ code, label, className }: ReferenceCodeProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-xs font-medium text-white/40 uppercase tracking-wide">{label}</span>
      )}
      <div
        className="inline-flex items-center gap-3 bg-accent/8 border border-accent/25 rounded-sm px-3.5 py-2 cursor-pointer hover:bg-accent/12 transition-colors w-fit"
        onClick={copyToClipboard}
      >
        <span className="font-mono text-sm text-accent font-medium">{code}</span>
        <svg 
          className={cn('w-4 h-4 transition-colors', copied ? 'text-accent' : 'text-accent/60')}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {copied ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          )}
        </svg>
      </div>
    </div>
  )
}
