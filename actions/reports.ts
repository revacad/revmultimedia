'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '')
  return `"${str.replace(/"/g, '""')}"`
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}

async function ensureAdmin() {
  await requireAdmin()
}

export async function exportApplicationsCSV(): Promise<string> {
  await ensureAdmin()
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('applications')
    .select(
      `
      reference, full_name, real_email, phone, country,
      status, app_fee_paid, created_at,
      courses(title), intakes(name)
    `,
    )
    .order('created_at', { ascending: false })

  if (!data?.length) {
    return toCsv(
      [
        'Reference',
        'Name',
        'Email',
        'Phone',
        'Country',
        'Status',
        'App Fee Paid',
        'Course',
        'Intake',
        'Date Applied',
      ],
      [],
    )
  }

  const rows = data.map((app) => {
    const course = relationOne(app.courses as { title: string } | { title: string }[] | null)
    const intake = relationOne(app.intakes as { name: string } | { name: string }[] | null)

    return [
      app.reference,
      app.full_name,
      app.real_email,
      app.phone,
      app.country,
      app.status,
      app.app_fee_paid ? 'Yes' : 'No',
      course?.title ?? '',
      intake?.name ?? '',
      new Date(app.created_at).toLocaleDateString('en-GB'),
    ]
  })

  return toCsv(
    [
      'Reference',
      'Name',
      'Email',
      'Phone',
      'Country',
      'Status',
      'App Fee Paid',
      'Course',
      'Intake',
      'Date Applied',
    ],
    rows,
  )
}

export async function exportStudentsCSV(): Promise<string> {
  await ensureAdmin()
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('students')
    .select(
      `
      student_id, full_name, real_email, phone,
      country, created_at,
      enrollments(status, courses(title))
    `,
    )
    .order('created_at', { ascending: false })

  const rows = (data ?? []).map((s) => {
    const enrollments =
      (s.enrollments as unknown as { status: string; courses: { title: string } | null }[]) ?? []
    const first = enrollments[0]
    return [
      s.student_id,
      s.full_name,
      s.real_email,
      s.phone,
      s.country,
      first?.courses?.title ?? '',
      first?.status ?? '',
      new Date(s.created_at).toLocaleDateString('en-GB'),
    ]
  })

  return toCsv(
    ['Student ID', 'Name', 'Email', 'Phone', 'Country', 'Course', 'Enrollment Status', 'Date Enrolled'],
    rows,
  )
}

export async function exportPaymentsCSV(): Promise<string> {
  await ensureAdmin()
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('invoices')
    .select(
      `
      reference, type, amount_ghs, total_ghs,
      status, payment_method, created_at,
      applications(full_name, real_email)
    `,
    )
    .order('created_at', { ascending: false })

  const rows = (data ?? []).map((inv) => {
    const app = relationOne(
      inv.applications as unknown as
        | { full_name: string; real_email: string }
        | { full_name: string; real_email: string }[]
        | null,
    )
    return [
      inv.reference,
      inv.type,
      app?.full_name ?? '',
      app?.real_email ?? '',
      inv.amount_ghs,
      inv.total_ghs,
      inv.status,
      inv.payment_method ?? '',
      new Date(inv.created_at).toLocaleDateString('en-GB'),
    ]
  })

  return toCsv(
    ['Invoice Ref', 'Type', 'Applicant', 'Email', 'Amount (GHS)', 'Total (GHS)', 'Status', 'Method', 'Date'],
    rows,
  )
}

export async function exportEnrollmentsCSV(): Promise<string> {
  await ensureAdmin()
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('enrollments')
    .select(
      `
      status, enrolled_at,
      students(student_id, full_name),
      courses(title, category),
      intakes(name)
    `,
    )
    .order('enrolled_at', { ascending: false })

  const rows = (data ?? []).map((row) => {
    const student = relationOne(
      row.students as unknown as
        | { student_id: string; full_name: string }
        | { student_id: string; full_name: string }[]
        | null,
    )
    const course = relationOne(
      row.courses as unknown as
        | { title: string; category: string }
        | { title: string; category: string }[]
        | null,
    )
    const intake = relationOne(
      row.intakes as unknown as { name: string } | { name: string }[] | null,
    )
    return [
      student?.student_id ?? '',
      student?.full_name ?? '',
      course?.title ?? '',
      course?.category ?? '',
      intake?.name ?? '',
      row.status,
      row.enrolled_at ? new Date(row.enrolled_at).toLocaleDateString('en-GB') : '',
    ]
  })

  return toCsv(
    ['Student ID', 'Student Name', 'Course', 'Category', 'Intake', 'Status', 'Enrolled Date'],
    rows,
  )
}
