import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/auth/admin'
import { resolveCampaignRecipients } from '@/lib/messaging/recipients'
import type { CampaignFilters } from '@/lib/messaging/types'

type SendBody = {
  filters: CampaignFilters
}

/** Resolves recipients for a campaign audience (admin-only). */
export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SendBody
  try {
    body = (await request.json()) as SendBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.filters?.audience && !body.filters?.recipientType) {
    return NextResponse.json({ error: 'filters.audience required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const recipients = await resolveCampaignRecipients(supabase, body.filters)

  return NextResponse.json({
    count: recipients.length,
    recipients: recipients.map((r) => ({
      studentId: r.studentId,
      applicationId: r.applicationId,
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
    })),
  })
}
