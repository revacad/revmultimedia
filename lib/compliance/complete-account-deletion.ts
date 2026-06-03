import { createAdminClient } from '@/lib/supabase/admin'
import { deleteR2Objects, deleteR2Prefix } from '@/lib/r2/delete-objects'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'

export type AccountDeletionContext = {
  authUserId: string
  studentDbId: string | null
  publicStudentId: string | null
  studentEmail: string
  applicationIds: string[]
}

export async function loadAccountDeletionContext(
  authUserId: string,
): Promise<AccountDeletionContext | null> {
  const admin = createAdminClient()

  const { data: applications } = await admin
    .from('applications')
    .select('id, real_email, full_name')
    .eq('auth_user_id', authUserId)

  const { data: student } = await admin
    .from('students')
    .select('id, student_id, real_email, full_name')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  const applicationIds = (applications ?? []).map((a) => a.id as string)
  const primaryApp = applications?.[0]

  const studentEmail =
    student?.real_email ??
    primaryApp?.real_email ??
    null

  if (!studentEmail) {
    return null
  }

  return {
    authUserId,
    studentDbId: student?.id ?? null,
    publicStudentId: student?.student_id ?? null,
    studentEmail,
    applicationIds,
  }
}

async function collectR2Keys(
  admin: ReturnType<typeof createAdminClient>,
  ctx: AccountDeletionContext,
): Promise<string[]> {
  const keys: string[] = []
  const appFilter =
    ctx.applicationIds.length > 0
      ? `application_id.in.(${ctx.applicationIds.join(',')})`
      : null

  if (ctx.studentDbId) {
    const { data: studentDocs } = await admin
      .from('documents')
      .select('r2_key')
      .eq('student_id', ctx.studentDbId)

    for (const doc of studentDocs ?? []) {
      if (doc.r2_key) keys.push(normalizeR2ObjectKey(doc.r2_key as string))
    }

    const { data: certs } = await admin
      .from('certificates')
      .select('r2_key')
      .eq('student_id', ctx.studentDbId)

    for (const cert of certs ?? []) {
      if (cert.r2_key) keys.push(normalizeR2ObjectKey(cert.r2_key as string))
    }

    const { data: studentRow } = await admin
      .from('students')
      .select('profile_photo_r2_key')
      .eq('id', ctx.studentDbId)
      .maybeSingle()

    if (studentRow?.profile_photo_r2_key) {
      keys.push(normalizeR2ObjectKey(studentRow.profile_photo_r2_key as string))
    }
  }

  if (appFilter) {
    const { data: appDocs } = await admin
      .from('documents')
      .select('r2_key')
      .in('application_id', ctx.applicationIds)

    for (const doc of appDocs ?? []) {
      if (doc.r2_key) keys.push(normalizeR2ObjectKey(doc.r2_key as string))
    }

    const { data: appInvoices } = await admin
      .from('invoices')
      .select('r2_key')
      .in('application_id', ctx.applicationIds)

    for (const inv of appInvoices ?? []) {
      if (inv.r2_key) keys.push(normalizeR2ObjectKey(inv.r2_key as string))
    }
  }

  if (ctx.studentDbId) {
    const { data: studentInvoices } = await admin
      .from('invoices')
      .select('r2_key')
      .eq('student_id', ctx.studentDbId)

    for (const inv of studentInvoices ?? []) {
      if (inv.r2_key) keys.push(normalizeR2ObjectKey(inv.r2_key as string))
    }
  }

  return [...new Set(keys.filter(Boolean))]
}

export async function executeAccountDeletion(
  ctx: AccountDeletionContext,
): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const r2Keys = await collectR2Keys(admin, ctx)

  if (ctx.studentDbId) {
    await admin
      .from('student_activity_logs')
      .delete()
      .eq('student_id', ctx.studentDbId)

    await admin
      .from('communication_logs')
      .delete()
      .eq('student_id', ctx.studentDbId)
  }

  if (ctx.applicationIds.length > 0) {
    await admin
      .from('admin_notes')
      .delete()
      .in('application_id', ctx.applicationIds)
  }

  if (ctx.studentDbId) {
    await admin.from('admin_notes').delete().eq('student_id', ctx.studentDbId)
  }

  let invoiceIds: string[] = []
  if (ctx.applicationIds.length > 0 || ctx.studentDbId) {
    let invoiceQuery = admin.from('invoices').select('id')

    if (ctx.studentDbId && ctx.applicationIds.length > 0) {
      invoiceQuery = invoiceQuery.or(
        `student_id.eq.${ctx.studentDbId},application_id.in.(${ctx.applicationIds.join(',')})`,
      )
    } else if (ctx.studentDbId) {
      invoiceQuery = invoiceQuery.eq('student_id', ctx.studentDbId)
    } else {
      invoiceQuery = invoiceQuery.in('application_id', ctx.applicationIds)
    }

    const { data: invoices } = await invoiceQuery
    invoiceIds = (invoices ?? []).map((i) => i.id as string)
  }

  if (invoiceIds.length > 0) {
    await admin.from('installments').delete().in('invoice_id', invoiceIds)
  }

  if (ctx.studentDbId) {
    await admin.from('certificates').delete().eq('student_id', ctx.studentDbId)
  }

  if (ctx.studentDbId && ctx.applicationIds.length > 0) {
    await admin
      .from('documents')
      .delete()
      .or(
        `student_id.eq.${ctx.studentDbId},application_id.in.(${ctx.applicationIds.join(',')})`,
      )
  } else if (ctx.studentDbId) {
    await admin.from('documents').delete().eq('student_id', ctx.studentDbId)
  } else if (ctx.applicationIds.length > 0) {
    await admin
      .from('documents')
      .delete()
      .in('application_id', ctx.applicationIds)
  }

  if (ctx.applicationIds.length > 0) {
    await admin
      .from('notifications_log')
      .delete()
      .in('application_id', ctx.applicationIds)
  }

  if (ctx.studentDbId) {
    await admin
      .from('notifications_log')
      .delete()
      .eq('student_id', ctx.studentDbId)
  }

  if (invoiceIds.length > 0) {
    await admin.from('invoices').delete().in('id', invoiceIds)
  }

  if (ctx.studentDbId) {
    await admin.from('enrollments').delete().eq('student_id', ctx.studentDbId)
    await admin.from('students').delete().eq('id', ctx.studentDbId)
  }

  if (ctx.applicationIds.length > 0) {
    await admin.from('applications').delete().in('id', ctx.applicationIds)
  }

  await deleteR2Objects(r2Keys)

  if (ctx.publicStudentId) {
    const id = ctx.publicStudentId
    await Promise.all([
      deleteR2Prefix(`documents/${id}`),
      deleteR2Prefix(`students/${id}`),
      deleteR2Prefix(`profiles/${id}`),
    ])
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(
    ctx.authUserId,
  )

  if (authDeleteError) {
    console.error('[compliance] auth user delete failed', authDeleteError)
    return { error: 'Failed to delete login account. Database records were removed.' }
  }

  return {}
}
