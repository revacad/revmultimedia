'use client'

import { useEffect, useId } from 'react'
import { PROMO_TERMS_TEXT } from '@/lib/public/promo-terms'

interface PromoTermsModalProps {
  open: boolean
  onClose: () => void
}

export default function PromoTermsModal({ open, onClose }: PromoTermsModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#1A1A2E]/60" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-lg font-semibold text-[#1A1A2E]">
          Promotional terms
        </h2>
        <p className="mt-3 font-body text-sm leading-relaxed text-[#5A5A7A]">{PROMO_TERMS_TEXT}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex w-full justify-center rounded-full bg-[#C74A86] px-5 py-2.5 font-body text-sm font-semibold text-white hover:opacity-90"
        >
          Close
        </button>
      </div>
    </div>
  )
}
