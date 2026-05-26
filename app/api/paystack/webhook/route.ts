import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { completePaystackCharge } from '@/lib/payments/complete-paystack-charge'
import { createAdminClient } from '@/lib/supabase/admin'

type PaystackWebhookEvent = {
  event: string
  data?: {
    reference?: string
    amount?: number
    metadata?: Record<string, unknown>
  }
}

function verifyPaystackSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !signature) {
    return false
  }

  const hash = createHmac('sha512', secret).update(rawBody).digest('hex')

  try {
    const hashBuffer = Buffer.from(hash, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')
    if (hashBuffer.length !== signatureBuffer.length) {
      return false
    }
    return timingSafeEqual(hashBuffer, signatureBuffer)
  } catch {
    return false
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature') ?? ''

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: PaystackWebhookEvent

  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent
  } catch {
    return NextResponse.json({ received: true })
  }

  if (event.event !== 'charge.success' || !event.data?.reference) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()
  const result = await completePaystackCharge(supabase, {
    paystackReference: event.data.reference,
    amountPesewas: event.data.amount,
    metadata: event.data.metadata,
  })

  if (!result.ok && result.reason !== 'invoice_not_found') {
    console.warn('[paystack:webhook] complete failed', {
      reference: event.data.reference,
      reason: result.reason,
    })
  }

  return NextResponse.json({ received: true })
}
