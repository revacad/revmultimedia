import { notFound, redirect } from 'next/navigation'
import GenerateInvoiceForm from '@/components/admin/invoices/GenerateInvoiceForm'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface NewTuitionInvoicePageProps {
  params: Promise<{ id: string }>
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function NewTuitionInvoicePage({ params }: NewTuitionInvoicePageProps) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: application, error } = await supabase
    .from('applications')
    .select(
      `
      id, reference, full_name, real_email, status,
      courses(id, title, tuition_fee_ghs),
      intakes(id, name, start_date),
      invoices(id, type, status, amount_ghs, reference)
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

  const invoices = (application.invoices as { id: string; type: string }[]) ?? []
  const tuitionInvoice = invoices.find((inv) => inv.type === 'tuition')
  if (tuitionInvoice) {
    redirect(`/admin/payments/${tuitionInvoice.id}`)
  }

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

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href={`/admin/applications/${id}`}
        className="mb-6 inline-block font-body text-sm text-[#9898B8] hover:text-[#1A1A2E]"
      >
        ← Application Detail
      </Link>
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">
          Generate Tuition Invoice
        </h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          {application.full_name} ·{' '}
          <span className="font-mono text-[#C74A86]">{application.reference}</span>
        </p>
      </header>

      <GenerateInvoiceForm
        application={{
          id: application.id,
          reference: application.reference,
          full_name: application.full_name,
          real_email: application.real_email,
          courses: course
            ? { title: course.title, tuition_fee_ghs: Number(course.tuition_fee_ghs) }
            : null,
          intakes: intake
            ? { name: intake.name, start_date: intake.start_date }
            : null,
        }}
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
