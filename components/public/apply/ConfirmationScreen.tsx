'use client'

import Link from 'next/link'
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
        <Link href="/portal/application" className="mt-4 block">
          <Button variant="primary" size="lg" className="w-full">
            Pay Now
          </Button>
        </Link>
      </div>

      <p className="mt-3 font-body text-[13px] text-[#9898B8]">
        Log in to your portal to pay and track your application
      </p>
    </div>
  )
}
