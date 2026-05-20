import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { Client } from '@upstash/qstash'
import { processCampaignBatch } from '@/lib/messaging/process-batch'

type ProcessBody = {
  campaignId: string
}

export async function POST(request: Request) {
  let bodyText: string

  if (process.env.NODE_ENV === 'development') {
    bodyText = await request.text()
  } else {
    const signature = request.headers.get('upstash-signature')
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY

    if (!signature || !currentSigningKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    bodyText = await request.text()
    const receiver = new Receiver({
      currentSigningKey,
      nextSigningKey: nextSigningKey ?? currentSigningKey,
    })

    try {
      await receiver.verify({
        signature,
        body: bodyText,
      })
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let body: ProcessBody
  try {
    body = JSON.parse(bodyText) as ProcessBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.campaignId) {
    return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
  }

  const result = await processCampaignBatch(body.campaignId)

  if (!result.done) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    const token = process.env.QSTASH_TOKEN
    if (baseUrl && token) {
      const client = new Client({ token })
      await client.publishJSON({
        url: `${baseUrl.replace(/\/$/, '')}/api/messaging/process`,
        body: { campaignId: body.campaignId },
        delay: 2,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    processed: result.processed,
    done: result.done,
  })
}
