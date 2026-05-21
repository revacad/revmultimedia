import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit/log'
import { runAfterResponse } from '@/lib/background'
import { sendApplicationReceived } from '@/lib/notifications/email'
import { sendMessage } from '@/lib/notifications/sms'
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

function metadataInvoiceRef(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null
  const ref = metadata.invoiceRef
  return typeof ref === 'string' ? ref : null
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

  const paystackReference = event.data.reference
  const invoiceRef = metadataInvoiceRef(event.data.metadata) ?? paystackReference

  if (!invoiceRef.startsWith('REVAPF')) {
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, reference, type, status, application_id')
    .eq('reference', invoiceRef)
    .maybeSingle()

  if (invoiceError) {
    console.error('[paystack:webhook] invoice lookup failed', invoiceError)
    return NextResponse.json({ received: true })
  }

  if (!invoice) {
    console.error('[paystack:webhook] invoice not found', { invoiceRef })
    return NextResponse.json({ received: true })
  }

  if (invoice.status === 'paid' || invoice.status === 'waived') {
    return NextResponse.json({ received: true })
  }

  const { error: updateInvoiceError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      payment_method: 'paystack',
      paystack_reference: paystackReference,
      updated_at: now,
    })
    .eq('id', invoice.id)

  if (updateInvoiceError) {
    console.error('[paystack:webhook] invoice update failed', updateInvoiceError)
    return NextResponse.json({ received: true })
  }

  if (invoice.type === 'application_fee' && invoice.application_id) {
    const { error: appError } = await supabase
      .from('applications')
      .update({
        app_fee_paid: true,
        app_fee_paid_at: now,
        updated_at: now,
      })
      .eq('id', invoice.application_id)

    if (appError) {
      console.error('[paystack:webhook] application update failed', appError)
    }

    const applicationId = invoice.application_id

    runAfterResponse(async () => {
      const { data: app } = await supabase
        .from('applications')
        .select('real_email, full_name, phone, reference')
        .eq('id', applicationId)
        .single()

      if (app) {
        await Promise.allSettled([
          sendApplicationReceived(app.real_email, {
            name: app.full_name,
            reference: app.reference,
          }),
          sendMessage(
            app.phone,
            `Rev Multimedia: Application fee received! Your application ${app.reference} is now under review. We'll update you soon.`,
            'sms',
          ),
        ])
      }
    })
  }

  await logAuditEvent({
    action: 'payment.paystack_webhook',
    entityType: 'invoice',
    entityId: invoice.id,
    newValue: {
      invoiceRef: invoice.reference,
      paystackReference,
      type: invoice.type,
      applicationId: invoice.application_id,
    },
  })

  return NextResponse.json({ received: true })
}
