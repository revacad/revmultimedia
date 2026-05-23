'use client'

import Link from 'next/link'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import ReferenceCode from '@/components/ui/ReferenceCode'

interface ConfirmationScreenProps {
  name: string
  email: string
  reference: string
}

export default function ConfirmationScreen({
  name,
  email,
  reference,
}: ConfirmationScreenProps) {
  const [showPayInfo, setShowPayInfo] = useState(false)

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
        <p className="font-display text-[28px] text-primary">GHS 100</p>
        <p className="mt-1 font-body text-[13px] text-[#9898B8]">
          Non-refundable application processing fee
        </p>

        {!showPayInfo ? (
          <button
            type="button"
            onClick={() => setShowPayInfo(true)}
            className="mt-4 block w-full"
          >
            <Button variant="primary" size="lg" className="w-full">
              Pay Application Fee: GHS 100
            </Button>
          </button>
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
