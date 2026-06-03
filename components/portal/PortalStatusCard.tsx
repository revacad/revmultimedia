'use client'

import ApplicationTimeline from '@/components/portal/ApplicationTimeline'
import ApplicationPicker, { type ApplicationPickerItem } from '@/components/portal/ApplicationPicker'
import type { ApplicationStatus } from '@/lib/applications/types'

interface PortalStatusCardProps {
  applications?: ApplicationPickerItem[]
  activeStep: number
  applicationStatus: ApplicationStatus
}

export default function PortalStatusCard({
  applications,
  activeStep,
  applicationStatus,
}: PortalStatusCardProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-card">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-body text-lg font-semibold text-[#1A1A2E]">
            Application status
          </h2>
          <p className="mt-1 font-body text-sm text-[#9898B8]">
            Track where you are in the admissions process
          </p>
        </div>
        {applications && applications.length > 1 ? (
          <ApplicationPicker items={applications} embedded />
        ) : null}
      </div>
      <ApplicationTimeline activeStep={activeStep} applicationStatus={applicationStatus} />
    </section>
  )
}
