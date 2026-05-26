'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatApplicationDate } from '@/lib/applications/format'
import type { ProgramLifecycleStatus } from '@/lib/enrollment/program-status'

export type StudentListRow = {
  id: string
  applicationId: string
  studentDbId?: string
  student_id: string | null
  reference: string
  full_name: string
  real_email: string
  phone: string
  country: string
  registered_at: string
  enrolled_at: string | null
  is_active: boolean
  lifecycleStatus: ProgramLifecycleStatus
  lifecycleLabel: string
}

interface StudentsPageClientProps {
  students: StudentListRow[]
}

export default function StudentsPageClient({ students }: StudentsPageClientProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        (s.student_id ?? '').toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q) ||
        s.real_email.toLowerCase().includes(q) ||
        s.reference.toLowerCase().includes(q),
    )
  }, [students, query])

  const enrolledCount = students.filter((s) => Boolean(s.enrolled_at)).length
  const registeredCount = students.filter((s) => s.lifecycleStatus === 'registered').length

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Students</h1>
        <p className="mt-2 font-body text-sm text-[#9898B8]">
          {students.length} programme registrations · {enrolledCount} enrolled ·{' '}
          {registeredCount} registered only
        </p>
        <p className="mt-1 font-body text-xs text-[#9898B8]">
          Enrolled = at least one tuition payment recorded and admission letter PDF sent from
          the application page.
        </p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by student ID, reference, name, or email"
        className="mb-6 w-full max-w-md rounded-[10px] border border-[#D8D8E8] px-4 py-3 font-body text-sm text-[#1A1A2E]"
      />

      <div className="overflow-hidden rounded-xl bg-white shadow-card">
        <table className="w-full min-w-[800px] text-left">
          <thead className="border-b border-[#EFEFF5] bg-[#F8F8FC]">
            <tr>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                Student ID
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                Name
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                Country
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                Date
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-body text-sm text-[#9898B8]">
                  No registrations found
                </td>
              </tr>
            ) : (
              filtered.map((student) => {
                const isEnrolled = Boolean(student.enrolled_at)
                const dateLabel = isEnrolled ? 'Enrolled' : 'Registered'
                const dateValue = isEnrolled
                  ? (student.enrolled_at ?? student.registered_at)
                  : student.registered_at
                const href = student.studentDbId
                  ? `/admin/students/${student.studentDbId}`
                  : `/admin/applications/${student.applicationId}`

                return (
                  <tr key={student.id} className="border-b border-[#EFEFF5] last:border-0">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-primary">
                      {student.student_id ?? '—'}
                      <span className="mt-0.5 block font-body text-xs font-semibold text-[#9898B8]">
                        {student.reference}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-sm font-medium text-[#1A1A2E]">
                        {student.full_name}
                      </p>
                      <p className="font-body text-xs text-[#9898B8]">{student.real_email}</p>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#5A5A7A]">{student.country}</td>
                    <td className="px-4 py-3 font-body text-sm text-[#9898B8]">
                      {dateLabel}:{' '}
                      <span className="text-[#5A5A7A]">
                        {formatApplicationDate(dateValue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#5A5A7A]">
                      {student.lifecycleLabel}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={href}
                        className="font-body text-sm font-semibold text-primary hover:underline"
                        aria-label={`View ${student.full_name}`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
