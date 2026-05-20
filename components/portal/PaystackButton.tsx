'use client'

import { useEffect } from 'react'

interface PaystackButtonProps {
  applicationRef: string
  invoiceRef: string
  amount: number
  email: string
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
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handlePayment = () => {
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!key || !window.PaystackPop) {
      console.error('Paystack is not configured')
      return
    }

    const handler = window.PaystackPop.setup({
      key,
      email,
      amount,
      currency: 'GHS',
      ref: invoiceRef,
      metadata: {
        applicationRef,
        invoiceRef,
      },
      callback: () => {
        window.location.reload()
      },
      onClose: () => {},
    })
    handler.openIframe()
  }

  return (
    <button
      type="button"
      onClick={handlePayment}
      style={{
        backgroundColor: '#C74A86',
        color: 'white',
        border: 'none',
        padding: '14px 32px',
        borderRadius: '9999px',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(199,74,134,0.25)',
      }}
    >
      Pay GHS {(amount / 100).toFixed(2)} with Paystack
    </button>
  )
}
