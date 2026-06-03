import { createAdminClient } from '@/lib/supabase/admin'
import { formatDocumentType } from '@/lib/applications/format'

const STUDENT_EXPORT_FIELDS = [
  'student_id',
  'full_name',
  'real_email',
  'phone',
  'date_of_birth',
  'gender',
  'country',
  'address',
  'state_region',
  'city',
  'is_active',
  'created_at',
  'updated_at',
] as const

export type StudentDataExport = {
  exported_at: string
  notice: string
  personal_details: Record<string, unknown> | null
  applications: Array<Record<string, unknown>>
  invoices: Array<Record<string, unknown>>
  installments: Array<Record<string, unknown>>
  enrollments: Array<Record<string, unknown>>
  documents: Array<Record<string, unknown>>
}

function pickStudentFields(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of STUDENT_EXPORT_FIELDS) {
    if (key in row && row[key] !== undefined) {
      out[key] = row[key]
    }
  }
  return out
}

export async function buildStudentDataExport(
  authUserId: string,
): Promise<StudentDataExport> {
  const supabase = createAdminClient()

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  const { data: applications } = await supabase
    .from('applications')
    .select(
      `
      id,
      reference,
      status,
      created_at,
      full_name,
      real_email,
      phone,
      date_of_birth,
      gender,
      country,
      address,
      state_region,
      city,
      qualification,
      institution,
      courses(title),
      intakes(name, start_date)
    `,
    )
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false })

  const appIds = (applications ?? []).map((a) => a.id as string).filter(Boolean)

  let invoices: Array<Record<string, unknown>> = []

  if (student?.id || appIds.length > 0) {
    let invoicesQuery = supabase
      .from('invoices')
      .select(
        'id, reference, type, amount_ghs, discount_ghs, total_ghs, status, due_date, created_at, updated_at',
      )

    if (student?.id && appIds.length > 0) {
      invoicesQuery = invoicesQuery.or(
        `student_id.eq.${student.id},application_id.in.(${appIds.join(',')})`,
      )
    } else if (student?.id) {
      invoicesQuery = invoicesQuery.eq('student_id', student.id)
    } else {
      invoicesQuery = invoicesQuery.in('application_id', appIds)
    }

    const { data: invoiceRows } = await invoicesQuery.order('created_at', {
      ascending: false,
    })
    invoices = invoiceRows ?? []
  }

  const invoiceIds = (invoices ?? []).map((inv) => inv.id as string).filter(Boolean)

  let installments: Array<Record<string, unknown>> = []
  if (invoiceIds.length > 0) {
    const { data: installmentRows } = await supabase
      .from('installments')
      .select(
        'amount_ghs, payment_method, paid_at, transaction_ref, invoices(reference)',
      )
      .in('invoice_id', invoiceIds)
      .order('paid_at', { ascending: false })

    installments = (installmentRows ?? []).map((row) => {
      const inv = Array.isArray(row.invoices)
        ? row.invoices[0]
        : row.invoices
      return {
        invoice_reference: (inv as { reference?: string } | null)?.reference ?? null,
        amount_ghs: row.amount_ghs,
        payment_method: row.payment_method,
        paid_at: row.paid_at,
        transaction_ref: row.transaction_ref ?? null,
      }
    })
  }

  let enrollments: Array<Record<string, unknown>> = []
  if (student?.id) {
    const { data: enrollmentRows } = await supabase
      .from('enrollments')
      .select(
        'status, enrolled_at, completed_at, courses(title), intakes(name, start_date)',
      )
      .eq('student_id', student.id)
      .order('enrolled_at', { ascending: false })

    enrollments = (enrollmentRows ?? []).map((row) => {
      const course = Array.isArray(row.courses) ? row.courses[0] : row.courses
      const intake = Array.isArray(row.intakes) ? row.intakes[0] : row.intakes
      return {
        course_title: (course as { title?: string } | null)?.title ?? null,
        intake_name: (intake as { name?: string } | null)?.name ?? null,
        intake_start_date: (intake as { start_date?: string } | null)?.start_date ?? null,
        status: row.status,
        enrolled_at: row.enrolled_at,
        completed_at: row.completed_at ?? null,
      }
    })
  }

  let documentsQuery = supabase
    .from('documents')
    .select('document_type, file_name, uploaded_at')
    .order('uploaded_at', { ascending: false })

  if (student?.id && appIds.length > 0) {
    documentsQuery = documentsQuery.or(
      `student_id.eq.${student.id},application_id.in.(${appIds.join(',')})`,
    )
  } else if (student?.id) {
    documentsQuery = documentsQuery.eq('student_id', student.id)
  } else if (appIds.length > 0) {
    documentsQuery = documentsQuery.in('application_id', appIds)
  }

  const { data: documentRows } = await documentsQuery

  const applicationsExport = (applications ?? []).map((app) => {
    const course = Array.isArray(app.courses) ? app.courses[0] : app.courses
    const intake = Array.isArray(app.intakes) ? app.intakes[0] : app.intakes
    return {
      reference: app.reference,
      course_title: (course as { title?: string } | null)?.title ?? null,
      intake_name: (intake as { name?: string } | null)?.name ?? null,
      intake_start_date: (intake as { start_date?: string } | null)?.start_date ?? null,
      status: app.status,
      submitted_at: app.created_at,
    }
  })

  const invoicesExport = invoices.map((inv) => ({
    reference: inv.reference,
    type: inv.type,
    amount_ghs: inv.amount_ghs,
    total_ghs: inv.total_ghs,
    status: inv.status,
    due_date: inv.due_date ?? null,
    created_at: inv.created_at,
    updated_at: inv.updated_at,
  }))

  const documentsExport = (documentRows ?? []).map((doc) => ({
    document_type: formatDocumentType(doc.document_type as string),
    file_name: doc.file_name,
    uploaded_at: doc.uploaded_at,
  }))

  const primaryApp = applications?.[0]
  const personalDetails = student
    ? pickStudentFields(student as Record<string, unknown>)
    : primaryApp
      ? {
          full_name: primaryApp.full_name,
          real_email: primaryApp.real_email,
          phone: primaryApp.phone,
          date_of_birth: primaryApp.date_of_birth,
          gender: primaryApp.gender,
          country: primaryApp.country,
          address: primaryApp.address,
          state_region: primaryApp.state_region ?? null,
          city: primaryApp.city ?? null,
        }
      : null

  return {
    exported_at: new Date().toISOString(),
    notice:
      'This file contains all personal data Rev Multimedia holds about you.',
    personal_details: personalDetails,
    applications: applicationsExport,
    invoices: invoicesExport,
    installments,
    enrollments,
    documents: documentsExport,
  }
}
