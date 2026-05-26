import { notFound, redirect } from 'next/navigation'
import CreateInvoiceForm, {
  type CreateInvoiceApplication,
  type CreateInvoicePaymentType,
} from '@/components/admin/invoices/CreateInvoiceForm'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { listActivePaymentTypes } from '@/lib/payments/payment-types'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface CreateInvoicePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function CreateApplicationInvoicePage({
  params,
  searchParams,
}: CreateInvoicePageProps) {
  await requireAdmin()
  const { id } = await params
  const { type: typeSlug } = await searchParams
  const supabase = createAdminClient()

  const { data: application, error } = await supabase
    .from('applications')
    .select(
      `
      id, reference, full_name, real_email, status,
      courses(id, title, tuition_fee_ghs),
      intakes(id, name, start_date),
      invoices(id, type, status, reference, total_ghs)
    `,
    )
    .eq('id', id)
    .single()

  if (error || !application) {
    notFound()
  }

  if (application.status !== 'accepted') {
    redirect(`/admin/applications/${id}`)
  }

  const paymentTypes = await listActivePaymentTypes(supabase)
  const creatableTypes: CreateInvoicePaymentType[] = paymentTypes
    .filter((pt) => pt.slug !== 'application_fee')
    .map((pt) => ({
      id: pt.id,
      slug: pt.slug,
      label: pt.label,
      description: pt.description,
    }))

  if (creatableTypes.length === 0) {
    notFound()
  }

  const invoices = (application.invoices as { id: string; type: string; status: string; reference: string; total_ghs: number }[]) ?? []
  const existingByType = Object.fromEntries(
    invoices.map((inv) => [inv.type, inv]),
  ) as Record<string, (typeof invoices)[0]>

  const { data: promoCodes } = await supabase
    .from('promo_codes')
    .select('id, code, discount_type, discount_value')
    .eq('is_active', true)
    .order('code')

  const { data: settings } = await supabase.from('system_settings').select('key, value')
  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value ?? '']))

  const course = firstRelation(
    application.courses as
      | { id: string; title: string; tuition_fee_ghs: number }
      | { id: string; title: string; tuition_fee_ghs: number }[]
      | null,
  )
  const intake = firstRelation(
    application.intakes as
      | { id: string; name: string; start_date: string }
      | { id: string; name: string; start_date: string }[]
      | null,
  )

  const appPayload: CreateInvoiceApplication = {
    id: application.id,
    reference: application.reference,
    full_name: application.full_name,
    real_email: application.real_email,
    courses: course
      ? { title: course.title, tuition_fee_ghs: Number(course.tuition_fee_ghs) }
      : null,
    intakes: intake ? { name: intake.name, start_date: intake.start_date } : null,
  }

  const initialPaymentTypeId =
    creatableTypes.find((pt) => pt.slug === typeSlug)?.id ??
    creatableTypes.find((pt) => pt.slug === 'tuition')?.id ??
    creatableTypes[0]?.id

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href={`/admin/applications/${id}`}
        className="mb-6 inline-block font-body text-sm text-[#9898B8] hover:text-[#1A1A2E]"
      >
        {'<'} Application Detail
      </Link>
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Create Invoice</h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          {application.full_name} ·{' '}
          <span className="font-mono text-[#C74A86]">{application.reference}</span>
        </p>
        <p className="mt-2 font-body text-xs text-[#9898B8]">
          The invoice PDF and payment instructions will be emailed and texted to the student when
          you submit.
        </p>
      </header>

      <CreateInvoiceForm
        application={appPayload}
        paymentTypes={creatableTypes}
        initialPaymentTypeId={initialPaymentTypeId}
        existingByType={existingByType}
        promoCodes={(promoCodes ?? []).map((p) => ({
          id: p.id,
          code: p.code,
          discount_type: p.discount_type as 'percentage' | 'flat_ghs',
          discount_value: Number(p.discount_value),
        }))}
        settings={settingsMap}
      />
    </div>
  )
}
