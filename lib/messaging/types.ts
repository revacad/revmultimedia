export type CommunicationChannel = 'email' | 'sms' | 'whatsapp'

export type AudienceFilter =
  | 'all_students'
  | 'students_by_course'
  | 'students_by_country'
  | 'students_paid_tuition'
  | 'students_unpaid_tuition'
  | 'students_partial_tuition'
  | 'students_completed'
  | 'all_applicants'
  | 'applicants_pending'
  | 'applicants_shortlisted'
  | 'applicants_accepted'
  | 'applicants_rejected'
  | 'applicants_deferred'
  | 'applicants_app_fee_unpaid'
  | 'applicants_app_fee_paid'
  | 'all'
  | 'direct'

/** @deprecated Legacy shape — prefer `audience` */
export type LegacyRecipientType = 'all' | 'course' | 'intake' | 'direct'

export type CampaignFilters = {
  audience: AudienceFilter
  courseId?: string
  country?: string
  studentId?: string
  /** @deprecated Use `audience: 'students_by_course'` */
  recipientType?: LegacyRecipientType
  intakeId?: string
}

export type CampaignRecipient = {
  studentId: string | null
  applicationId: string | null
  fullName: string
  email: string
  phone: string
}
