import Image from 'next/image'
import ApplicationStatusBadge from '@/components/admin/applications/ApplicationStatusBadge'
import type { ApplicationStatus } from '@/lib/applications/types'

interface PortalDashboardHeroProps {
  displayName: string
  identifier: string
  identifierLabel: string
  statusLabel?: string
  statusVariant?: ApplicationStatus
  enrolled?: boolean
}

export default function PortalDashboardHero({
  displayName,
  identifier,
  identifierLabel,
  statusLabel,
  statusVariant,
  enrolled,
}: PortalDashboardHeroProps) {
  return (
    <section className="relative min-h-[220px] overflow-hidden rounded-2xl">
      <Image
        src="/images/apply-background.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="(max-width: 900px) 100vw, 900px"
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(26, 26, 46, 0.75)' }}
        aria-hidden
      />
      <div className="relative z-10 flex min-h-[220px] flex-col justify-end p-6 sm:p-8">
        <p className="font-body text-sm font-medium uppercase tracking-wider text-white/70">
          Welcome back
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
          {displayName}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div>
            <p className="font-body text-xs text-white/60">{identifierLabel}</p>
            <p className="font-mono text-base font-semibold text-white sm:text-lg">
              {identifier}
            </p>
          </div>
          {enrolled && (
            <span className="inline-flex rounded-full bg-[#1E9990]/90 px-3 py-1 font-body text-xs font-semibold text-white">
              Enrolled
            </span>
          )}
          {statusVariant && (
            <ApplicationStatusBadge
              status={statusVariant}
              className="shadow-sm"
            />
          )}
          {!statusVariant && statusLabel && (
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 font-body text-xs font-semibold text-white">
              {statusLabel}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
