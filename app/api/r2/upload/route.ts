import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { z } from 'zod'
import { s3Client } from '@/lib/r2/client'
import { authorizeUploadRequest } from '@/lib/r2/authorize-upload'
import { APPLICATION_DOCUMENT_TYPES } from '@/lib/security/files'
import { applicationUploadLimit, fileUploadBurstLimit } from '@/lib/redis/ratelimit'
import { apiErrorResponse } from '@/lib/errors/api'
import { getRequestIp, rateLimitOrNull } from '@/lib/security/rate-limit-request'
import {
  UploadValidationError,
  validateAndSanitizeUpload,
} from '@/lib/security/upload-validate'
import { normalizeR2ObjectKey } from '@/lib/r2/keys'
import type { UploadContextKind } from '@/lib/security/upload-policy'

export const maxDuration = 60

const uploadContextSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('application_document'),
    draftId: z.string().uuid(),
    documentType: z.enum(APPLICATION_DOCUMENT_TYPES),
  }),
  z.object({
    type: z.literal('profile_photo'),
    studentId: z.string().min(1),
  }),
  z.object({
    type: z.literal('student_document'),
    studentId: z.string().min(1),
    documentType: z.enum(['certificate', 'other']),
  }),
  z.object({
    type: z.literal('certificate'),
    studentId: z.string().min(1),
    courseSlug: z.string().min(1),
    enrollmentId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('course_thumbnail'),
    courseId: z.string().uuid().optional(),
  }),
  z.object({
    type: z.literal('course_content'),
    courseId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('course_instructor_photo'),
    courseId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('resource'),
  }),
  z.object({
    type: z.literal('document'),
    applicationRef: z.string().min(1),
    documentType: z.string().min(1),
  }),
  z.object({
    type: z.literal('team_photo'),
    memberSlug: z.string().min(1),
  }),
])

function bucketForKey(key: string): string | null {
  const privateBucket =
    process.env.CLOUDFLARE_R2_BUCKET_NAME ?? process.env.R2_BUCKET_NAME
  const publicBucket = process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME

  if (key.startsWith('courses/') && key.includes('/content/')) {
    return publicBucket ?? null
  }
  if (key.startsWith('team/')) {
    return publicBucket ?? null
  }
  return privateBucket ?? null
}

function contextGuardKey(
  context: z.infer<typeof uploadContextSchema>,
  key: string,
): boolean {
  switch (context.type) {
    case 'application_document':
      return key.includes(`documents/drafts/${context.draftId}/`)
    case 'profile_photo':
      return key.startsWith('profiles/')
    case 'student_document':
      return key.includes(`documents/${context.studentId}/`) || key.startsWith('documents/')
    case 'certificate':
      return key.startsWith('certificates/')
    case 'course_content':
      return key.includes(`/content/`)
    case 'course_thumbnail':
      return key.includes('thumbnail') || key.includes('thumbnails/')
    case 'course_instructor_photo':
      return key.includes('instructor-photo')
    case 'resource':
      return key.startsWith('resources/')
    case 'document':
      return key.includes(context.applicationRef)
    case 'team_photo':
      return key.startsWith('team/')
    default:
      return false
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getRequestIp(request)
  const burstLimited = await rateLimitOrNull(fileUploadBurstLimit, [ip])
  if (burstLimited) return burstLimited

  const limited = await rateLimitOrNull(applicationUploadLimit, [ip])
  if (limited) return limited

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const keyRaw = formData.get('key')
    const uploadContextRaw = formData.get('uploadContext')

    if (!(file instanceof File) || typeof keyRaw !== 'string' || !keyRaw.trim()) {
      return NextResponse.json({ error: 'Missing file or key' }, { status: 400 })
    }

    if (typeof uploadContextRaw !== 'string' || !uploadContextRaw.trim()) {
      return NextResponse.json({ error: 'Missing upload context' }, { status: 400 })
    }

    let uploadContext: z.infer<typeof uploadContextSchema>
    try {
      uploadContext = uploadContextSchema.parse(JSON.parse(uploadContextRaw))
    } catch {
      return NextResponse.json({ error: 'Invalid upload context' }, { status: 400 })
    }

    const key = normalizeR2ObjectKey(keyRaw)
    if (!key || !contextGuardKey(uploadContext, key)) {
      return NextResponse.json({ error: 'Invalid upload key' }, { status: 400 })
    }

    const auth = await authorizeUploadRequest(request, {
      type: uploadContext.type as UploadContextKind,
      draftId:
        uploadContext.type === 'application_document'
          ? uploadContext.draftId
          : undefined,
      studentId:
        uploadContext.type === 'profile_photo' ||
        uploadContext.type === 'student_document'
          ? uploadContext.studentId
          : undefined,
      enrollmentId:
        uploadContext.type === 'certificate' ? uploadContext.enrollmentId : undefined,
      documentType:
        uploadContext.type === 'application_document' ||
        uploadContext.type === 'student_document'
          ? uploadContext.documentType
          : undefined,
    })
    if (auth instanceof NextResponse) return auth

    const buffer = Buffer.from(await file.arrayBuffer())

    let sanitized
    try {
      sanitized = await validateAndSanitizeUpload({
        buffer,
        originalFileName: file.name,
        declaredMime: file.type,
        uploadKind: uploadContext.type,
        documentType:
          uploadContext.type === 'application_document' ||
          uploadContext.type === 'student_document'
            ? uploadContext.documentType
            : undefined,
        route: 'r2/upload',
        ip,
        userId: auth.userId,
      })
    } catch (error) {
      if (error instanceof UploadValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }

    const bucketName = bucketForKey(key)
    if (!bucketName) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })
    }

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: sanitized.buffer,
        ContentType: sanitized.contentType,
        ContentDisposition: 'attachment',
      }),
    )

    return NextResponse.json({ success: true, key })
  } catch (error) {
    return apiErrorResponse('r2/upload', error)
  }
}
