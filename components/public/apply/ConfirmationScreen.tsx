'use client'

import Link from 'next/link'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import ReferenceCode from '@/components/ui/ReferenceCode'
import { formatGHS } from '@/lib/utils'

interface ConfirmationScreenProps {
  name: string
  email: string
  reference: string
  applicationFeeGhs: number
  waitlisted?: boolean
  waitlistPosition?: number
}

export default function ConfirmationScreen({
  name,
  email,
  reference,
  applicationFeeGhs,
  waitlisted = false,
  waitlistPosition,
}: ConfirmationScreenProps) {
  const [showPayInfo, setShowPayInfo] = useState(false)
  const feeLabel = formatGHS(applicationFeeGhs)

  if (waitlisted) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[#7B5AE8] bg-[#F3EEFF]">
          <svg className="h-10 w-10 text-[#7B5AE8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="mt-6 font-display text-[32px] text-[#1A1A2E]">You are on the waitlist</h1>

        <p className="mt-3 font-body text-base text-[#5A5A7A]">
          Thank you, {name}. Your application reference is:
        </p>

        <div className="mt-4 flex justify-center">
          <ReferenceCode code={reference} />
        </div>

        {waitlistPosition != null && (
          <p className="mt-4 font-body text-base font-semibold text-[#7B5AE8]">
            You are #{waitlistPosition} on the waitlist
          </p>
        )}

        <p className="mt-3 font-body text-sm text-[#9898B8]">
          We have sent a confirmation to {email}.
        </p>

        <div className="mt-8 rounded-[14px] border border-[#7B5AE8]/25 bg-[#F3EEFF] p-5 text-left">
          <p className="font-body text-sm text-[#5A5A7A]">
            No payment is required at this time. We will contact you by email and SMS when a spot
            becomes available. You can then log in to your portal to confirm your interest.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#7B5AE8] px-5 py-3 font-body text-sm font-semibold text-white no-underline"
          >
            Log in to portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[#2DBFB8] bg-[#EBF9F8]">
        <svg className="h-10 w-10 text-[#2DBFB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-6 font-display text-[32px] text-[#1A1A2E]">Application received.</h1>

      <p className="mt-3 font-body text-base text-[#5A5A7A]">
        Thank you, {name}. Your application reference is:
      </p>

      <div className="mt-4 flex justify-center">
        <ReferenceCode code={reference} />
      </div>

      <p className="mt-3 font-body text-sm text-[#9898B8]">
        We have sent a confirmation to {email}.
      </p>

      <hr className="my-8 border-[#EFEFF5]" />

      <p className="font-body text-base font-semibold text-[#1A1A2E]">Next step: Pay your application fee</p>

      <div className="mt-4 rounded-[14px] border border-[#EFEFF5] bg-[#F7F8FC] p-5 text-left">
        <p className="font-display text-[28px] text-primary">{feeLabel}</p>
        <p className="mt-1 font-body text-[13px] text-[#9898B8]">
          Non-refundable application processing fee
        </p>

        {!showPayInfo ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="mt-4 w-full"
            onClick={() => setShowPayInfo(true)}
          >
            Pay Application Fee: {feeLabel}
          </Button>
        ) : (
          <div
            style={{
              backgroundColor: '#EBF9F8',
              border: '1.5px solid rgba(45,191,184,0.30)',
              borderRadius: '14px',
              padding: '20px 24px',
              marginTop: '16px',
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
              Pay via your student portal
            </p>
            <p
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                color: '#5A5A7A',
                lineHeight: 1.6,
                marginBottom: '0',
              }}
            >
              You will need to log in to your portal to pay. Use your Application Reference and the
              password you created when applying.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              <Link
                href="/login"
                style={{
                  flex: 1,
                  minWidth: '140px',
                  padding: '12px 20px',
                  backgroundColor: '#C74A86',
                  color: 'white',
                  borderRadius: '9999px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Log in to portal
              </Link>
              <button
                type="button"
                onClick={() => setShowPayInfo(false)}
                style={{
                  flex: 1,
                  minWidth: '100px',
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: '#5A5A7A',
                  border: '1.5px solid #D8D8E8',
                  borderRadius: '9999px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 font-body text-[13px] text-[#9898B8]">
        Log in to your portal to pay and track your application
      </p>
    </div>
  )
}
