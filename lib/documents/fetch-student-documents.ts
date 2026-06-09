import type { SupabaseClient } from '@supabase/supabase-js'

export type StudentDocumentRow = {
  id: string
  document_type: string
  file_name: string
  r2_key: string
  uploaded_at: string | null
}

/** Application documents for all student rows and applications owned by this auth user. */
export async function fetchStudentDocuments(
  supabase: SupabaseClient,
  params: {
    studentDbIds: string[]
    applicationIds: string[]
    documentTypes?: readonly string[]
  },
): Promise<StudentDocumentRow[]> {
  const { studentDbIds, applicationIds, documentTypes } = params

  if (studentDbIds.length === 0 && applicationIds.length === 0) {
    return []
  }

  let query = supabase
    .from('documents')
    .select('id, document_type, file_name, r2_key, uploaded_at')
    .order('uploaded_at', { ascending: false })

  const orFilters: string[] = []
  if (studentDbIds.length === 1) {
    orFilters.push(`student_id.eq.${studentDbIds[0]}`)
  } else if (studentDbIds.length > 1) {
    orFilters.push(`student_id.in.(${studentDbIds.join(',')})`)
  }
  if (applicationIds.length === 1) {
    orFilters.push(`application_id.eq.${applicationIds[0]}`)
  } else if (applicationIds.length > 1) {
    orFilters.push(`application_id.in.(${applicationIds.join(',')})`)
  }

  if (orFilters.length === 1) {
    const filter = orFilters[0]
    if (filter.startsWith('student_id')) {
      query = studentDbIds.length === 1
        ? query.eq('student_id', studentDbIds[0]!)
        : query.in('student_id', studentDbIds)
    } else {
      query = applicationIds.length === 1
        ? query.eq('application_id', applicationIds[0]!)
        : query.in('application_id', applicationIds)
    }
  } else {
    query = query.or(orFilters.join(','))
  }

  const { data, error } = await query

  if (error) {
    console.error('[documents] fetchStudentDocuments failed', {
      studentDbIds,
      applicationIds,
      message: error.message,
    })
    return []
  }

  const seenIds = new Set<string>()
  const deduped: StudentDocumentRow[] = []

  for (const row of data ?? []) {
    const id = row.id as string
    if (seenIds.has(id)) continue
    seenIds.add(id)
    deduped.push({
      id,
      document_type: row.document_type as string,
      file_name: row.file_name as string,
      r2_key: row.r2_key as string,
      uploaded_at: (row.uploaded_at as string | null) ?? null,
    })
  }

  if (!documentTypes?.length) {
    return deduped
  }

  const allowed = new Set(documentTypes)
  return deduped.filter((doc) => allowed.has(doc.document_type))
}
