'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaystackButtonProps {
  applicationRef: string
  invoiceRef: string
  amount: number
  email: string
}

type PaystackCallbackResponse = {
  reference?: string
  trans?: string
  status?: string
  message?: string
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void }
    }
  }
}

export function PaystackButton({
  applicationRef,
  invoiceRef,
  amount,
  email,
}: PaystackButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  async function confirmPaymentOnServer(reference: string) {
    setConfirming(true)
    setError(null)

    try {
      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      const data = (await res.json()) as { error?: string; success?: boolean }

      if (!res.ok) {
        setError(data.error ?? 'Payment verification failed. Please refresh in a moment.')
        return
      }

      router.refresh()
    } catch {
      setError(
        'We could not confirm your payment yet. If Paystack charged you, refresh this page in a minute.',
      )
    } finally {
      setConfirming(false)
    }
  }

  const handlePayment = () => {
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!key || !window.PaystackPop) {
      console.error('Paystack is not configured')
      setError('Online payment is not configured. Please contact the academy.')
      return
    }

    setError(null)

    const paystackRef = `${invoiceRef}-${Date.now()}`

    const handler = window.PaystackPop.setup({
      key,
      email,
      amount,
      currency: 'GHS',
      ref: paystackRef,
      metadata: {
        invoiceRef,
        applicationRef,
      },
      callback: (response: PaystackCallbackResponse) => {
        const reference = response?.reference ?? paystackRef
        void confirmPaymentOnServer(reference)
      },
      onClose: () => {},
    })
    handler.openIframe()
  }

  const disabled = amount <= 0 || confirming

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handlePayment}
        disabled={disabled}
        style={{
          backgroundColor: '#C74A86',
          color: 'white',
          border: 'none',
          padding: '14px 32px',
          borderRadius: '9999px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '15px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          boxShadow: disabled ? 'none' : '0 8px 32px rgba(199,74,134,0.25)',
        }}
      >
        {confirming
          ? 'Confirming payment…'
          : disabled && amount <= 0
            ? 'Nothing left to pay'
            : `Pay GHS ${(amount / 100).toFixed(2)}`}
      </button>
      {error && (
        <p className="max-w-sm text-center font-body text-sm text-[#E84A4A]">{error}</p>
      )}
    </div>
  )
}
