import { TIMELINE_STEPS } from '@/lib/portal/timeline'

interface ApplicationTimelineProps {
  activeStep: number
}

export default function ApplicationTimeline({ activeStep }: ApplicationTimelineProps) {
  return (
    <div className="w-full overflow-x-auto pb-2 md:overflow-visible">
      <div className="flex min-w-0 flex-wrap items-start gap-y-4 md:min-w-[640px] md:flex-nowrap">
        {TIMELINE_STEPS.map((label, index) => {
          const step = index + 1
          const completed = step < activeStep
          const current = step === activeStep
          const upcoming = step > activeStep

          return (
            <div key={label} className="flex flex-1 flex-col items-center">
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
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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
              <p className="mt-2 text-center font-body text-[11px] leading-tight text-[#5A5A7A]">
                {label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
