/** Explicit API response DTOs — only these fields may be sent to clients. */

export type CourseSearchResult = {
  title: string
  slug: string
  category: string
  mode: string
  tuition_fee_ghs: number
}

export type AdminSearchStudentResult = {
  id: string
  student_id: string
  full_name: string
}

export type AdminSearchApplicationResult = {
  id: string
  reference: string
  full_name: string
  status: string
}

export type AdminSearchCourseResult = {
  id: string
  title: string
  slug: string
  category: string
}

export type SchoolSearchResult = {
  name: string
  region: string | null
  school_type: string | null
}

export type CampaignRecipientResult = {
  fullName: string
  email: string
  phone: string
}

export type PaystackVerifySuccess = {
  success: true
  alreadyPaid: boolean
  invoiceRef: string
}

export function toCourseSearchResult(row: {
  title: string
  slug: string
  category: string
  mode: string
  tuition_fee_ghs: number
}): CourseSearchResult {
  return {
    title: row.title,
    slug: row.slug,
    category: row.category,
    mode: row.mode,
    tuition_fee_ghs: row.tuition_fee_ghs,
  }
}

export function toAdminSearchStudentResult(row: {
  id: string
  student_id: string
  full_name: string
}): AdminSearchStudentResult {
  return {
    id: row.id,
    student_id: row.student_id,
    full_name: row.full_name,
  }
}

export function toAdminSearchApplicationResult(row: {
  id: string
  reference: string
  full_name: string
  status: string
}): AdminSearchApplicationResult {
  return {
    id: row.id,
    reference: row.reference,
    full_name: row.full_name,
    status: row.status,
  }
}

export function toAdminSearchCourseResult(row: {
  id: string
  title: string
  slug: string
  category: string
}): AdminSearchCourseResult {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
  }
}

export function toSchoolSearchResult(row: {
  name: string
  region: string | null
  school_type: string | null
}): SchoolSearchResult {
  return {
    name: row.name,
    region: row.region,
    school_type: row.school_type,
  }
}

export function toCampaignRecipientResult(row: {
  fullName: string
  email: string
  phone: string
}): CampaignRecipientResult {
  return {
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
  }
}
