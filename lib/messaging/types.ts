export type CommunicationChannel = 'email' | 'sms' | 'whatsapp'

export type CampaignFilters = {
  recipientType: 'all' | 'course' | 'intake' | 'direct'
  courseId?: string
  intakeId?: string
  studentId?: string
}

export type CampaignRecipient = {
  studentId: string
  fullName: string
  email: string
  phone: string
}
