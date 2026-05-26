import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface NewTuitionInvoicePageProps {
  params: Promise<{ id: string }>
}

/** Legacy URL — tuition invoice creation lives on the unified create page. */
export default async function NewTuitionInvoicePage({ params }: NewTuitionInvoicePageProps) {
  const { id } = await params
  redirect(`/admin/applications/${id}/invoice/create?type=tuition`)
}
