'use client'

import { useState, useTransition } from 'react'
import Button from '@/components/ui/Button'
import { resendInvoiceEmail } from '@/actions/payment'

export default function ResendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          setMessage(null)
          startTransition(async () => {
            const result = await resendInvoiceEmail(invoiceId)
            if ('error' in result) {
              setMessage(result.error)
            } else {
              setMessage('Invoice email sent')
            }
          })
        }}
      >
        {pending ? 'Sending…' : 'Resend Invoice Email'}
      </Button>
      {message && (
        <p className="mt-2 font-body text-xs text-[#9898B8]">{message}</p>
      )}
    </div>
  )
}
