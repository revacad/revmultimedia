import type { CourseCategory, CourseMode } from '@/lib/courses/types'

export const APPLICATION_STATUSES = [
  'pending',
  'under_review',
  'shortlisted',
  'accepted',
  'rejected',
  'deferred',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export type ApplicationListRow = {
  id: string
  reference: string
  full_name: string
  real_email: string
  phone: string
  country: string
  status: ApplicationStatus
  app_fee_paid: boolean
  created_at: string
  courses: { title: string; category: CourseCategory } | null
  intakes: { name: string; start_date: string } | null
}

export type ApplicationDocument = {
  id: string
  document_type: string
  r2_key: string
  file_name: string
  file_size_bytes: number | null
  mime_type: string | null
  uploaded_at: string | null
}

export type ApplicationInvoice = {
  id: string
  reference: string
  type: string
  payment_type_label: string | null
  amount_ghs: number
  total_ghs: number
  status: string
  created_at: string | null
  installments?: { amount_ghs: number }[]
}

export type ApplicationAdminNote = {
  id: string
  note: string
  created_at: string
  admins: { full_name: string } | null
}

export type ApplicationDetail = {
  id: string
  reference: string
  full_name: string
  real_email: string
  enrolled_at: string | null
  admission_letter_sent_at: string | null
  admission_letter_r2_key: string | null
  phone: string
  date_of_birth: string
  gender: string
  country: string
  address: string
  state_region: string | null
  city: string | null
  qualification: string
  institution: string
  year_completed: number
  prior_experience: string | null
  hybrid_attendance_confirmed: boolean
  status: ApplicationStatus
  app_fee_paid: boolean
  created_at: string
  updated_at: string
  courses: {
    id: string
    title: string
    category: CourseCategory
    mode: CourseMode
    tuition_fee_ghs: number
  } | null
  intakes: {
    id: string
    name: string
    start_date: string
    end_date: string
    max_slots: number | null
    enrolled_count: number | null
  } | null
  documents: ApplicationDocument[] | null
  invoices: ApplicationInvoice[] | null
  admin_notes: ApplicationAdminNote[] | null
}
