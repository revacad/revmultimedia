import PromoCodesPageClient, {
  type PromoCodeRow,
} from '@/components/admin/promo/PromoCodesPageClient'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Promo Codes — Admin',
}

export const dynamic = 'force-dynamic'

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default async function AdminPromoCodesPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*, admins(full_name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/promo-codes] fetch failed', error)
  }

  const promoCodes: PromoCodeRow[] = (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: Number(row.discount_value),
    max_uses: row.max_uses,
    uses_count: row.uses_count,
    expires_at: row.expires_at,
    is_active: row.is_active,
    created_at: row.created_at,
    admins: firstRelation(row.admins as PromoCodeRow['admins'] | PromoCodeRow['admins'][] | null),
  }))

  return <PromoCodesPageClient promoCodes={promoCodes} />
}
