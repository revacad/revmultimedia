import { z } from 'zod'

const audienceValues = [
  'all_students',
  'students_by_course',
  'students_by_country',
  'students_paid_tuition',
  'students_unpaid_tuition',
  'students_partial_tuition',
  'students_completed',
  'all_applicants',
  'applicants_pending',
  'applicants_shortlisted',
  'applicants_accepted',
  'applicants_rejected',
  'applicants_deferred',
  'applicants_app_fee_unpaid',
  'applicants_app_fee_paid',
  'all',
  'direct',
] as const

export const MESSAGE_MAX_SMS = 1600
export const MESSAGE_MAX_EMAIL = 50_000
export const COMMUNICATION_SUBJECT_MAX = 200

const channelSchema = z.enum(['email', 'sms', 'whatsapp'])

export const campaignFiltersSchema = z
  .object({
    audience: z.enum(audienceValues),
    courseId: z.uuid().optional(),
    country: z.string().min(1).max(100).optional(),
    studentId: z.uuid().optional(),
    intakeId: z.uuid().optional(),
    recipientType: z.enum(['all', 'course', 'intake', 'direct']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.audience === 'students_by_course' && !data.courseId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Course is required for this audience',
        path: ['courseId'],
      })
    }
    if (data.audience === 'students_by_country' && !data.country?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Country is required for this audience',
        path: ['country'],
      })
    }
    if (data.audience === 'direct' && !data.studentId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Student is required for direct messages',
        path: ['studentId'],
      })
    }
  })

function messageMaxForChannel(channel: z.infer<typeof channelSchema>): number {
  return channel === 'email' ? MESSAGE_MAX_EMAIL : MESSAGE_MAX_SMS
}

function refineMessageAndSubject(
  data: { channel: z.infer<typeof channelSchema>; subject?: string; message: string },
  ctx: z.RefinementCtx,
) {
  const maxLen = messageMaxForChannel(data.channel)
  if (data.message.length > maxLen) {
    ctx.addIssue({
      code: 'custom',
      message: `Message must be at most ${maxLen} characters`,
      path: ['message'],
    })
  }
  if (data.channel === 'email' && !data.subject?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Subject is required for email',
      path: ['subject'],
    })
  }
  if (data.subject && data.subject.length > COMMUNICATION_SUBJECT_MAX) {
    ctx.addIssue({
      code: 'custom',
      message: `Subject must be at most ${COMMUNICATION_SUBJECT_MAX} characters`,
      path: ['subject'],
    })
  }
}

export const createCampaignInputSchema = z
  .object({
    channel: channelSchema,
    subject: z.string().max(COMMUNICATION_SUBJECT_MAX).optional(),
    message: z.string().min(1),
    filters: campaignFiltersSchema,
  })
  .superRefine(refineMessageAndSubject)

export const sendDirectMessageInputSchema = z
  .object({
    studentId: z.uuid(),
    channel: channelSchema,
    subject: z.string().max(COMMUNICATION_SUBJECT_MAX).optional(),
    message: z.string().min(1),
  })
  .superRefine(refineMessageAndSubject)
