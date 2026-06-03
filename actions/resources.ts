'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { requireStaffAdmin } from '@/lib/auth/admin'
import { logAuditEvent } from '@/lib/audit/log'
import { logStudentActivity } from '@/lib/student-activity/log'
import { assertStudentCanAccessResource } from '@/lib/resources/student-access'
import { r2DocumentHref } from '@/lib/r2/document-url'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'
import {
  deleteResourceSchema,
  resourceUrlSchema,
  uploadResourceSchema,
} from '@/lib/validations/resources'
import { safeActionError } from '@/lib/errors/action'

export async function uploadResource(data: {
  title: string
  description?: string
  r2Key: string
  fileName: string
  fileType: 'pdf' | 'image'
  fileSize: number
  visibility: 'all_students' | 'course_specific' | 'intake_specific'
  courseId?: string
  intakeId?: string
}): Promise<{ success: true } | { error: string }> {
  const parsed = uploadResourceSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid resource details' }
  }

  let session
  try {
    session = await requireStaffAdmin()
  } catch {
    return { error: 'Not authenticated' }
  }

  const payload = parsed.data
  if (payload.visibility === 'course_specific' && !payload.courseId) {
    return { error: 'courseId is required when visibility is course_specific' }
  }
  if (payload.visibility === 'intake_specific' && !payload.intakeId) {
    return { error: 'intakeId is required when visibility is intake_specific' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase.from('resources').insert({
    title: payload.title,
    description: payload.description || null,
    file_r2_key: payload.r2Key,
    file_name: payload.fileName,
    file_type: payload.fileType,
    file_size: payload.fileSize,
    visibility: payload.visibility,
    course_id: payload.courseId || null,
    intake_id: payload.intakeId || null,
    uploaded_by: session.adminId,
  })

  if (error) return safeActionError('resource.upload', error, 'Failed to upload resource.')

  await logAuditEvent({
    adminId: session.adminId,
    action: 'resource.created',
    entityType: 'resource',
    newValue: { title: payload.title, visibility: payload.visibility },
  })

  revalidatePath('/admin/resources')
  return { success: true }
}

export async function deleteResource(
  resourceId: string,
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteResourceSchema.safeParse({ resourceId })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid resource id' }
  }

  try {
    await requireStaffAdmin()
  } catch {
    return { error: 'Not authenticated' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('resources').delete().eq('id', resourceId)

  if (error) return safeActionError('resource.delete', error, 'Failed to delete resource.')

  revalidatePath('/admin/resources')
  return { success: true }
}

export async function getResourceUrl(resourceId: string): Promise<string> {
  const parsed = resourceUrlSchema.safeParse({ resourceId })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid resource id')
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const admin = createAdminClient()

  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!student) {
    throw new Error('You do not have access to this resource.')
  }

  const { data: resource } = await admin
    .from('resources')
    .select('file_r2_key, file_name, visibility, course_id, intake_id, is_active')
    .eq('id', parsed.data.resourceId)
    .maybeSingle()

  if (!resource) {
    throw new Error('Resource not found')
  }

  await assertStudentCanAccessResource(admin, student.id, resource)

  await logStudentActivity({
    studentId: student.id,
    action: 'resource.downloaded',
    metadata: { resourceId: parsed.data.resourceId, fileName: resource.file_name },
  })

  return r2DocumentHref(normalizeR2ObjectKey(resource.file_r2_key))
}

export async function getAdminResourceUrl(resourceId: string): Promise<string> {
  const parsed = resourceUrlSchema.safeParse({ resourceId })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid resource id')
  }

  try {
    await requireStaffAdmin()
  } catch {
    throw new Error('Unauthorized')
  }

  const supabase = createAdminClient()
  const { data: resource } = await supabase
    .from('resources')
    .select('file_r2_key')
    .eq('id', parsed.data.resourceId)
    .maybeSingle()

  if (!resource) throw new Error('Resource not found')

  return r2DocumentHref(normalizeR2ObjectKey(resource.file_r2_key))
}
