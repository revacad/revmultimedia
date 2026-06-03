import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getFishAfricaWebhookSignature,
  verifyFishAfricaWebhookSignature,
} from '@/lib/webhooks/fishafrica-signature'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const webhookSecret = process.env.FISHAFRICA_WEBHOOK_SECRET?.trim()

  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[fishafrica/webhook] FISHAFRICA_WEBHOOK_SECRET is not configured')
      return NextResponse.json({ error: 'Not configured' }, { status: 503 })
    }
    console.warn(
      '[fishafrica/webhook] No webhook secret configured - skipping signature verification',
    )
  } else {
    const signature = getFishAfricaWebhookSignature(request)
    if (!signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    if (!verifyFishAfricaWebhookSignature(rawBody, webhookSecret, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  try {
    const body = JSON.parse(rawBody) as Record<string, unknown>

    const messageId =
      (typeof body.message_id === 'string' && body.message_id) ||
      (typeof body.id === 'string' && body.id) ||
      null
    const status =
      typeof body.status === 'string' ? body.status.toLowerCase() : null

    if (messageId && status) {
      const supabase = createAdminClient()

      const mappedStatus =
        status === 'delivered'
          ? 'sent'
          : status === 'sent'
            ? 'sent'
            : status === 'failed'
              ? 'failed'
              : status === 'undelivered'
                ? 'failed'
                : null

      if (mappedStatus) {
        await supabase
          .from('communication_logs')
          .update({
            status: mappedStatus,
            provider_response: body,
          })
          .eq('provider_message_id', messageId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Fish Africa webhook error:', {
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ received: true })
  }
}
