'use client'

const STEPS = [
  'Personal Info',
  'Course',
  'Education',
  'Documents',
  'Review',
] as const

interface StepIndicatorProps {
  currentStep: number
  totalSteps?: number
}

export default function StepIndicator({
  currentStep,
  totalSteps = STEPS.length,
}: StepIndicatorProps) {
  return (
    <div className="mb-8 flex w-full items-start justify-center gap-0">
      {STEPS.slice(0, totalSteps).map((label, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isActive = stepNumber === currentStep
        return (
          <div key={label} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {index > 0 && (
                <div
                  className="h-0.5 flex-1"
                  style={{
                    backgroundColor: stepNumber <= currentStep ? '#C74A86' : '#EFEFF5',
                  }}
                />
              )}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                style={
                  isCompleted
                    ? { backgroundColor: '#C74A86', color: '#ffffff' }
                    : isActive
                      ? {
                          backgroundColor: '#ffffff',
                          border: '2px solid #C74A86',
                          color: '#C74A86',
                        }
                      : {
                          backgroundColor: '#EFEFF5',
                          color: '#9898B8',
                        }
                }
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              {index < totalSteps - 1 && (
                <div
                  className="h-0.5 flex-1"
                  style={{
                    backgroundColor: stepNumber < currentStep ? '#C74A86' : '#EFEFF5',
                  }}
                />
              )}
            </div>
            <span
              className="mt-2 hidden px-1 text-center text-xs sm:block"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: isActive ? 600 : 400,
                color: isCompleted ? '#C74A86' : isActive ? '#1A1A2E' : '#9898B8',
              }}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
