import type { SupabaseClient } from '@supabase/supabase-js'

export async function findPreviousApplicationId(
  supabase: SupabaseClient,
  params: {
    studentDbId: string
    authUserId: string
    originalApplicationId: string | null
    excludeApplicationId: string
  },
): Promise<string | null> {
  const orParts = [
    `returning_student_id.eq.${params.studentDbId}`,
    `auth_user_id.eq.${params.authUserId}`,
  ]
  if (params.originalApplicationId) {
    orParts.push(`id.eq.${params.originalApplicationId}`)
  }

  const { data } = await supabase
    .from('applications')
    .select('id')
    .or(orParts.join(','))
    .neq('id', params.excludeApplicationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

export async function copyDocumentsFromPreviousApplication(
  supabase: SupabaseClient,
  sourceApplicationId: string,
  targetApplicationId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: sourceDocs, error: fetchError } = await supabase
    .from('documents')
    .select('document_type, r2_key, file_name, file_size_bytes, mime_type, uploaded_by')
    .eq('application_id', sourceApplicationId)

  if (fetchError) {
    return { ok: false, error: fetchError.message }
  }

  if (!sourceDocs?.length) {
    return { ok: false, error: 'No documents found on previous application' }
  }

  const rows = sourceDocs.map((doc) => ({
    application_id: targetApplicationId,
    document_type: doc.document_type,
    r2_key: doc.r2_key,
    file_name: doc.file_name,
    file_size_bytes: doc.file_size_bytes,
    mime_type: doc.mime_type,
    uploaded_by: doc.uploaded_by,
  }))

  const { error: insertError } = await supabase.from('documents').insert(rows)
  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  return { ok: true }
}
