import type { SupabaseClient } from '@supabase/supabase-js'
import type { InvoiceType } from '@/lib/payments/types'

export type PaymentTypeRow = {
  id: string
  slug: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  allow_paystack: boolean
}

/** Core types used by apply flow and tuition invoicing — cannot be deactivated. */
export const PROTECTED_PAYMENT_TYPE_SLUGS = ['application_fee', 'tuition'] as const

const FALLBACK_LABELS: Record<InvoiceType, string> = {
  application_fee: 'Application fee',
  tuition: 'Tuition fee',
}

export function slugFromPaymentTypeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, 'type_$1')
    .slice(0, 64)
}

export function paymentTypeLabelFromSlug(slug: string): string {
  if (slug in FALLBACK_LABELS) {
    return FALLBACK_LABELS[slug as InvoiceType]
  }
  return slug.replace(/_/g, ' ')
}

export async function listAllPaymentTypes(
  supabase: SupabaseClient,
): Promise<PaymentTypeRow[]> {
  const { data } = await supabase
    .from('payment_types')
    .select('id, slug, label, description, is_active, sort_order, allow_paystack')
    .order('sort_order')
    .order('label')

  return (data ?? []) as PaymentTypeRow[]
}

export async function getPaymentTypeIdBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('payment_types')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  return data?.id ?? null
}

export async function listActivePaymentTypes(
  supabase: SupabaseClient,
): Promise<PaymentTypeRow[]> {
  const { data } = await supabase
    .from('payment_types')
    .select('id, slug, label, description, is_active, sort_order, allow_paystack')
    .eq('is_active', true)
    .order('sort_order')

  return (data ?? []) as PaymentTypeRow[]
}
