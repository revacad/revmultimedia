import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function PortalDashboardEmptyApplications() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl bg-white px-8 py-14 text-center shadow-card">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FDF0F6]">
        <svg
          className="h-10 w-10 text-[#C74A86]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">No applications yet</h1>
      <p className="mt-3 max-w-sm font-body text-sm leading-relaxed text-[#5A5A7A]">
        You have not started an application. Apply for a course to get started.
      </p>
      <Link href="/apply/level-up" className="mt-8">
        <Button variant="primary" size="lg">
          Apply now
        </Button>
      </Link>
    </div>
  )
}
