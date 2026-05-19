'use client'

import { useState } from 'react'

export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="rounded-full border border-[#D8D8E8] px-3 py-1.5 font-body text-xs font-semibold text-[#5A5A7A] hover:border-[#C74A86] hover:text-[#C74A86]"
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
