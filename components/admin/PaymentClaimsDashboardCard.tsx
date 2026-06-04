import Link from 'next/link'

interface PaymentClaimsDashboardCardProps {
  pendingCount: number
}

export default function PaymentClaimsDashboardCard({
  pendingCount,
}: PaymentClaimsDashboardCardProps) {
  return (
    <Link
      href="/admin/payments?tab=claims"
      className="block rounded-xl bg-white p-6 shadow-card transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-body text-base font-semibold text-[#1A1A2E]">
            Pending Payment Claims
          </h2>
          <p className="mt-1 font-body text-sm text-[#9898B8]">
            Manual payment claims awaiting verification
          </p>
        </div>
        <span
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 font-display text-2xl font-semibold ${
            pendingCount > 0
              ? 'bg-[#C74A86] text-white'
              : 'bg-[#F0F0F8] text-[#5A5A7A]'
          }`}
        >
          {pendingCount}
        </span>
      </div>
      <p className="mt-4 font-body text-sm font-semibold text-primary">
        Review payment claims
      </p>
    </Link>
  )
}
