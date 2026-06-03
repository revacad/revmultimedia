'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PortalErrorState from '@/components/portal/PortalErrorState'

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
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const [paystackReady, setPaystackReady] = useState(false)

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

  useEffect(() => {
    if (!publicKey) {
      setError({
        title: 'Online payment unavailable',
        message:
          'Card payments are temporarily unavailable. Use the bank transfer instructions on this page, or try again later.',
      })
      return
    }

    if (window.PaystackPop) {
      setPaystackReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => setPaystackReady(true)
    script.onerror = () => {
      setError({
        title: 'Payment form did not load',
        message: 'We could not open the payment window. Check your connection and try again.',
      })
    }
    document.head.appendChild(script)

    return () => {
      script.onload = null
      script.onerror = null
    }
  }, [publicKey])

  async function confirmPaymentOnServer(reference: string) {
    setConfirming(true)
    setError(null)

    try {
      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      const data = (await res.json()) as {
        error?: string
        success?: boolean
        alreadyPaid?: boolean
      }

      if (!res.ok || !data.success) {
        setError({
          title: 'Payment not confirmed yet',
          message:
            'We could not confirm your payment right away. If Paystack charged you, wait a minute and try again.',
        })
        return
      }

      router.refresh()
    } catch {
      setError({
        title: 'Payment not confirmed yet',
        message:
          'We could not confirm your payment right away. If Paystack charged you, wait a minute and try again.',
      })
    } finally {
      setConfirming(false)
    }
  }

  const handlePayment = () => {
    if (!publicKey || !paystackReady || !window.PaystackPop) {
      setError(
        !publicKey
          ? {
              title: 'Online payment unavailable',
              message:
                'Card payments are temporarily unavailable. Use the bank transfer instructions on this page.',
            }
          : {
              title: 'Payment form is loading',
              message: 'Please wait a moment, then try again.',
            },
      )
      return
    }

    setError(null)

    const paystackRef = `${invoiceRef}-${Date.now()}`

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount,
      currency: 'GHS',
      ref: paystackRef,
      metadata: {
        invoiceRef,
        applicationRef,
      },
      callback: (response: PaystackCallbackResponse) => {
        const reference =
          (typeof response === 'object' && response?.reference) ||
          (typeof response === 'string' ? response : null) ||
          paystackRef
        void confirmPaymentOnServer(reference)
      },
      onClose: () => {},
    })
    handler.openIframe()
  }

  const disabled = amount <= 0 || confirming || !paystackReady || !publicKey

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
          : !publicKey
            ? 'Payment unavailable'
            : !paystackReady
              ? 'Loading payment…'
              : amount <= 0
                ? 'Nothing left to pay'
                : `Pay GHS ${(amount / 100).toFixed(2)}`}
      </button>
      {error && (
        <PortalErrorState
          variant="inline"
          title={error.title}
          message={error.message}
          onRetry={() => {
            setError(null)
            if (paystackReady) {
              handlePayment()
            } else {
              router.refresh()
            }
          }}
        />
      )}
    </div>
  )
}
