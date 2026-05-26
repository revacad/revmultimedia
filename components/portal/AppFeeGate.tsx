'use client'

import { useEffect, useState } from 'react'
import { PaystackButton } from '@/components/portal/PaystackButton'

interface AppFeeGateProps {
  appFeePaid: boolean
  invoiceRef?: string
  appFeeAmount?: number
  applicationRef?: string
  payerEmail?: string
  children: React.ReactNode
}

export function AppFeeGate({
  appFeePaid,
  invoiceRef,
  appFeeAmount,
  applicationRef,
  payerEmail,
  children,
}: AppFeeGateProps) {
  const [showInfo, setShowInfo] = useState(true)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!showInfo) return
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowInfo(false)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showInfo])

  if (appFeePaid) return <>{children}</>

  const amountGhs = appFeeAmount ?? 100

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#FDF0F6',
          border: '2px solid rgba(199,74,134,0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C74A86" strokeWidth="2" aria-hidden>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>

      <h3
        style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: '20px',
          color: '#1A1A2E',
          marginBottom: '8px',
        }}
      >
        Pay your application fee to unlock
      </h3>
      <p
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '15px',
          color: '#5A5A7A',
          maxWidth: '360px',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}
      >
        Your application has been received. Pay the GHS {amountGhs} application fee to access your
        full portal.
      </p>

      {invoiceRef && (
        <div
          style={{
            backgroundColor: '#F7F8FC',
            border: '1px solid #EFEFF5',
            borderRadius: '10px',
            padding: '12px 20px',
            marginBottom: '20px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '14px',
            color: '#C74A86',
          }}
        >
          {invoiceRef}
        </div>
      )}

      {showInfo && (
        <div
          style={{
            backgroundColor: '#EBF9F8',
            border: '1.5px solid rgba(45,191,184,0.30)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '20px',
            position: 'relative',
            maxWidth: '420px',
            width: '100%',
          }}
        >
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              color: '#1A1A2E',
              marginBottom: '8px',
            }}
          >
            You will be redirected to Paystack
          </p>
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              color: '#5A5A7A',
              lineHeight: 1.6,
              marginBottom: '12px',
            }}
          >
            Click the button below to pay your GHS {amountGhs} application fee securely.
            We will confirm your payment and unlock your portal right away.
          </p>
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#9898B8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Dismiss ({countdown}s)
          </button>
        </div>
      )}

      {invoiceRef && applicationRef && payerEmail && (
        <PaystackButton
          applicationRef={applicationRef}
          invoiceRef={invoiceRef}
          amount={Math.round(amountGhs * 100)}
          email={payerEmail}
        />
      )}
    </div>
  )
}
