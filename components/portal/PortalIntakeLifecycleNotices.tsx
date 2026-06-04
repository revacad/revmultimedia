import type { ProgrammeLifecycleNotice } from '@/lib/portal/intake-lifecycle-notices'

interface PortalIntakeLifecycleNoticesProps {
  notices: ProgrammeLifecycleNotice[]
}

export default function PortalIntakeLifecycleNotices({
  notices,
}: PortalIntakeLifecycleNoticesProps) {
  if (notices.length === 0) return null

  return (
    <div className="space-y-3">
      {notices.map((notice) => (
        <div
          key={`${notice.variant}-${notice.courseTitle}-${notice.endDateLabel}`}
          className={`rounded-2xl border px-5 py-4 font-body text-sm leading-relaxed ${
            notice.variant === 'closed'
              ? 'border-[#1E9990]/30 bg-[#E8F7F5] text-[#1A1A2E]'
              : 'border-amber-200 bg-amber-50 text-[#1A1A2E]'
          }`}
        >
          {notice.variant === 'closed' ? (
            <p>
              Your <span className="font-semibold">{notice.courseTitle}</span> programme ended
              on {notice.endDateLabel}. Your certificate will be issued within 14 days.
            </p>
          ) : (
            <p>
              Your <span className="font-semibold">{notice.courseTitle}</span> programme has
              reached its scheduled end date. Please check with your coordinator for any
              updates.
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
