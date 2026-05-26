import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/auth/admin'
import { resolveCampaignRecipients } from '@/lib/messaging/recipients'
import type { CampaignFilters } from '@/lib/messaging/types'
import { messagingSendBodySchema } from '@/lib/validations/api'

/** Resolves recipients for a campaign audience (admin-only). */
export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let filters: CampaignFilters
  try {
    const json: unknown = await request.json()
    const parsed = messagingSendBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 },
      )
    }
    filters = parsed.data.filters as CampaignFilters
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const recipients = await resolveCampaignRecipients(supabase, filters)

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
