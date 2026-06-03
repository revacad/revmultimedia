import { NextResponse } from 'next/server'
import { authErrorResponse } from '@/lib/errors/api'
import { assertDraftUploadAuthorized } from '@/lib/apply/verify-draft-upload-token'
import { getAdminSession } from '@/lib/auth/admin'
import { assertCanUploadCertificate } from '@/lib/enrollment/certificate-upload'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import type { UploadContextKind } from '@/lib/security/upload-policy'

export type UploadAuthContext = {
  type: UploadContextKind
  draftId?: string
  studentId?: string
  enrollmentId?: string
  courseId?: string
  documentType?: string
}

async function requireActiveAdmin(authUserId: string): Promise<{ adminId: string } | null> {
  const adminClient = createAdminClient()
  const { data: admin, error } = await adminClient
    .from('admins')
    .select('id, is_active')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error || !admin?.is_active) return null
  return { adminId: admin.id }
}

export async function authorizeUploadRequest(
  request: Request,
  context: UploadAuthContext,
): Promise<{ userId: string | null; adminId?: string } | NextResponse> {
  if (context.type === 'application_document') {
    if (!context.draftId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const authError = await assertDraftUploadAuthorized(request, context.draftId)
    if (authError) return authError
    return { userId: null }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return authErrorResponse('r2/upload', authError)
  }

  const adminOnly = new Set<UploadContextKind>([
    'certificate',
    'course_thumbnail',
    'team_photo',
    'document',
    'course_content',
    'course_instructor_photo',
    'resource',
  ])

  if (adminOnly.has(context.type)) {
    const admin = await requireActiveAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (context.type === 'certificate' && context.enrollmentId) {
      const enrollmentCheck = await assertCanUploadCertificate(
        createAdminClient(),
        context.enrollmentId,
      )
      if (!enrollmentCheck.ok) {
        return NextResponse.json({ error: enrollmentCheck.error }, { status: 403 })
      }
    }

    return { userId: user.id, adminId: admin.adminId }
  }

  if (
    (context.type === 'profile_photo' || context.type === 'student_document') &&
    context.studentId
  ) {
    const admin = createAdminClient()
    const { data: student } = await admin
      .from('students')
      .select('auth_user_id')
      .eq('id', context.studentId)
      .maybeSingle()

    if (!student || student.auth_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return { userId: user.id }
}
