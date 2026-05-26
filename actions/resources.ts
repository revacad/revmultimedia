'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit/log'
import { logStudentActivity } from '@/lib/student-activity/log'
import { generatePresignedDownloadUrl } from '@/lib/r2/presign'
import {
  deleteResourceSchema,
  resourceUrlSchema,
  uploadResourceSchema,
} from '@/lib/validations/resources'

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

  const supabase = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const payload = parsed.data
  if (payload.visibility === 'course_specific' && !payload.courseId) {
    return { error: 'courseId is required when visibility is course_specific' }
  }
  if (payload.visibility === 'intake_specific' && !payload.intakeId) {
    return { error: 'intakeId is required when visibility is intake_specific' }
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!admin) return { error: 'Not an admin' }

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
    uploaded_by: admin.id,
  })

  if (error) return { error: error.message }

  await logAuditEvent({
    adminId: admin.id,
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

  const supabase = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!admin) return { error: 'Not an admin' }

  const { error } = await supabase.from('resources').delete().eq('id', resourceId)

  if (error) return { error: error.message }

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

  const { data: resource } = await supabase
    .from('resources')
    .select('file_r2_key, file_name')
    .eq('id', resourceId)
    .single()

  if (!resource) throw new Error('Resource not found')

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (student) {
    await logStudentActivity({
      studentId: student.id,
      action: 'resource.downloaded',
      metadata: { resourceId, fileName: resource.file_name },
    })
  }

  return generatePresignedDownloadUrl(
    process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    resource.file_r2_key,
    3600,
  )
}

export async function getAdminResourceUrl(resourceId: string): Promise<string> {
  const parsed = resourceUrlSchema.safeParse({ resourceId })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid resource id')
  }

  const supabase = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!admin) throw new Error('Not an admin')

  const { data: resource } = await supabase
    .from('resources')
    .select('file_r2_key')
    .eq('id', resourceId)
    .single()

  if (!resource) throw new Error('Resource not found')

  return generatePresignedDownloadUrl(
    process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    resource.file_r2_key,
    3600,
  )
}
