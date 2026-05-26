import { NextResponse } from 'next/server'
import { z } from 'zod'
import { completePaystackCharge } from '@/lib/payments/complete-paystack-charge'
import { resolvePaystackInvoiceRef } from '@/lib/payments/paystack-invoice'
import { verifyTransaction } from '@/lib/payments/paystack'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  reference: z.string().min(1),
})

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    const json = await request.json()
    body = bodySchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const verified = await verifyTransaction(body.reference)

    const invoiceRef = resolvePaystackInvoiceRef(
      verified.metadata,
      body.reference,
    )

    if (!invoiceRef) {
      console.error('[paystack:verify] could not resolve invoice', {
        reference: body.reference,
        metadata: verified.metadata,
      })
      return NextResponse.json(
        { error: 'Payment could not be matched to an invoice.' },
        { status: 400 },
      )
    }

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, reference, status, applications(auth_user_id)')
      .eq('reference', invoiceRef)
      .maybeSingle()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const applicationRel = invoice.applications as
      | { auth_user_id: string }
      | { auth_user_id: string }[]
      | null
    const application = Array.isArray(applicationRel)
      ? (applicationRel[0] ?? null)
      : applicationRel
    if (!application || application.auth_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const result = await completePaystackCharge(admin, {
      paystackReference: body.reference,
      amountPesewas: verified.amount,
      metadata: verified.metadata,
    })

    if (!result.ok) {
      const message =
        result.reason === 'application_fee_underpaid' ||
        result.reason === 'amount_less_than_remaining'
          ? 'Payment amount did not match the invoice total. Contact support with your receipt.'
          : 'Payment could not be confirmed. Please try again or contact support.'

      return NextResponse.json({ error: message, reason: result.reason }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      alreadyPaid: result.alreadyPaid,
      invoiceRef: result.invoiceRef,
    })
  } catch (e) {
    console.error('[paystack:verify]', e)
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : 'Could not verify payment. Please wait a moment and refresh.',
      },
      { status: 502 },
    )
  }
}
