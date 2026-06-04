'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Intake } from '@/lib/courses/types'
import { formatDate } from '@/lib/utils'
import { isIntakeFull } from '@/lib/apply/intake-availability'
import {
  getIntakeLifecycleStatus,
  intakeLifecycleStatusLabel,
  isIntakeEndedNotClosed,
  todayDateString,
} from '@/lib/intakes/lifecycle'
import IntakeCloseButton from '@/components/admin/intakes/IntakeCloseButton'
import IntakeDuplicateModal, {
  type IntakeCourseOption,
} from '@/components/admin/intakes/IntakeDuplicateModal'
import IntakeDeleteModal from '@/components/admin/intakes/IntakeDeleteModal'
import IntakeWaitlistNotifyModal from '@/components/admin/intakes/IntakeWaitlistNotifyModal'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

interface IntakeRow extends Intake {
  course?: { title: string; slug: string }
}

interface IntakeTableProps {
  intakes: IntakeRow[]
  courses: IntakeCourseOption[]
  waitlistCounts?: Record<string, number>
  fetchError?: string | null
}

export default function IntakeTable({
  intakes,
  courses,
  waitlistCounts = {},
  fetchError = null,
}: IntakeTableProps) {
  const [duplicateIntake, setDuplicateIntake] = useState<IntakeRow | null>(null)
  const [deleteIntakeRow, setDeleteIntakeRow] = useState<IntakeRow | null>(null)
  const [notifyIntake, setNotifyIntake] = useState<IntakeRow | null>(null)
  const today = todayDateString()

  if (fetchError) {
    return (
      <ErrorState message="We could not load this data. Please refresh the page." />
    )
  }

  if (intakes.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        }
        message="No intakes yet"
        description="Create your first intake to open applications for a course."
        action={{ label: 'Create your first intake', href: '/admin/intakes/new' }}
      />
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide">
                Intake
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide">
                Course
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide">
                Dates
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide">
                Enrolled
              </th>
              <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wide">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {intakes.map((intake) => {
              const waitlistCount = waitlistCounts[intake.id] ?? 0
              const intakeFull = !intake.is_closed && isIntakeFull(intake)
              const lifecycleStatus = getIntakeLifecycleStatus(intake, today)
              const endedNotClosed = isIntakeEndedNotClosed(intake, today)

              return (
                <tr
                  key={intake.id}
                  className="border-b border-gray-100 hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3 font-medium text-dark">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{intake.name}</span>
                      {endedNotClosed && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          Ended - mark complete
                        </span>
                      )}
                      {waitlistCount > 0 && (
                        <span className="rounded-full bg-[#F3EEFF] px-2 py-0.5 text-xs font-semibold text-[#7B5AE8]">
                          {waitlistCount} waitlisted
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {intake.course?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(intake.start_date)} – {formatDate(intake.end_date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {intake.enrolled_count}
                    {intake.max_slots != null ? ` / ${intake.max_slots}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          lifecycleStatus === 'closed'
                            ? 'bg-gray-100 text-gray-600'
                            : lifecycleStatus === 'ended'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-accent/15 text-accent'
                        }`}
                      >
                        {intakeLifecycleStatusLabel(lifecycleStatus)}
                      </span>
                      {intakeFull && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Full
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-3">
                      {waitlistCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setNotifyIntake(intake)}
                          className="text-[13px] font-semibold text-[#7B5AE8] hover:underline"
                        >
                          Notify waitlist
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteIntakeRow(intake)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete intake"
                        aria-label={`Delete ${intake.name}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateIntake(intake)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-primary"
                        title="Duplicate intake"
                        aria-label={`Duplicate ${intake.name}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <Link
                        href={`/admin/intakes/${intake.id}`}
                        className="text-primary hover:text-primary-hover font-medium"
                      >
                        Edit
                      </Link>
                      {!intake.is_closed && <IntakeCloseButton intakeId={intake.id} />}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {duplicateIntake ? (
        <IntakeDuplicateModal
          intake={duplicateIntake}
          courses={courses}
          onClose={() => setDuplicateIntake(null)}
        />
      ) : null}

      {deleteIntakeRow ? (
        <IntakeDeleteModal
          intake={deleteIntakeRow}
          onClose={() => setDeleteIntakeRow(null)}
        />
      ) : null}

      {notifyIntake ? (
        <IntakeWaitlistNotifyModal
          intakeId={notifyIntake.id}
          intakeName={notifyIntake.name}
          onClose={() => setNotifyIntake(null)}
        />
      ) : null}
    </>
  )
}
