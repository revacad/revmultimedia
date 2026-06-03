'use client'

import {
  TIMELINE_STATUS_DESCRIPTIONS,
  TIMELINE_STEPS,
} from '@/lib/portal/timeline'

interface ApplicationTimelineProps {
  activeStep: number
  applicationStatus?: string
}

export default function ApplicationTimeline({
  activeStep,
  applicationStatus,
}: ApplicationTimelineProps) {
  const statusNote =
    applicationStatus === 'rejected'
      ? TIMELINE_STATUS_DESCRIPTIONS.rejected
      : applicationStatus === 'waitlisted'
        ? TIMELINE_STATUS_DESCRIPTIONS.waitlisted
        : null

  return (
    <div className="w-full">
      <div className="portal-timeline-scroll overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        <div className="inline-flex min-w-max items-start whitespace-nowrap">
          {TIMELINE_STEPS.map((label, index) => {
            const step = index + 1
            const completed = step < activeStep
            const current = step === activeStep
            const upcoming = step > activeStep

            return (
              <div
                key={label}
                className="inline-flex w-[88px] shrink-0 flex-col items-center px-1"
              >
                <div className="flex w-full items-center">
                  {index > 0 && (
                    <div
                      className="h-0.5 flex-1"
                      style={{ backgroundColor: completed || current ? '#C74A86' : '#EFEFF5' }}
                    />
                  )}
                  <div
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: completed ? '#C74A86' : current ? '#FFFFFF' : '#EFEFF5',
                      border: current ? '2px solid #C74A86' : 'none',
                    }}
                  >
                    {completed && (
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {current && (
                      <span className="absolute h-2.5 w-2.5 animate-pulse rounded-full bg-[#C74A86]" />
                    )}
                    {upcoming && !completed && !current && (
                      <span className="h-2 w-2 rounded-full bg-[#D8D8E8]" />
                    )}
                  </div>
                  {index < TIMELINE_STEPS.length - 1 && (
                    <div
                      className="h-0.5 flex-1"
                      style={{ backgroundColor: completed ? '#C74A86' : '#EFEFF5' }}
                    />
                  )}
                </div>
                <p
                  className={`mt-2 whitespace-normal text-center font-body text-[11px] leading-tight ${
                    current ? 'font-bold text-[#C74A86]' : 'font-medium text-[#5A5A7A]'
                  }`}
                >
                  {label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {statusNote && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 ${
            applicationStatus === 'rejected'
              ? 'border-[#E84A4A]/25 bg-[#FDECEC]'
              : 'border-[#7B5AE8]/25 bg-[#F3EEFF]'
          }`}
          role="status"
        >
          <p
            className={`font-body text-sm leading-relaxed ${
              applicationStatus === 'rejected' ? 'text-[#5A5A7A]' : 'text-[#5A3FC0]'
            }`}
          >
            {statusNote}
          </p>
        </div>
      )}
    </div>
  )
}
