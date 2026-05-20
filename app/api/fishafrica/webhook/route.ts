import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    console.log('Fish Africa webhook:', JSON.stringify(body))

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
    console.error('Fish Africa webhook error:', error)
    return NextResponse.json({ received: true })
  }
}
