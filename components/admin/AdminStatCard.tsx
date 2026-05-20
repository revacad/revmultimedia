import type { ReactNode } from 'react'

interface AdminStatCardProps {
  icon: ReactNode
  iconBg: string
  label: string
  value: string
  valueClassName?: string
}

export default function AdminStatCard({
  icon,
  iconBg,
  label,
  value,
  valueClassName,
}: AdminStatCardProps) {
  return (
    <article className="rounded-xl bg-white p-6 shadow-card">
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <p
        className={`font-display text-4xl font-semibold text-[#1A1A2E] ${valueClassName ?? ''}`}
      >
        {value}
      </p>
      <p className="mt-1 font-body text-[13px] font-medium uppercase tracking-wide text-[#9898B8]">
        {label}
      </p>
    </article>
  )
}
