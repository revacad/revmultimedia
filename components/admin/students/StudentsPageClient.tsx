'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import AdminStudentAvatar from '@/components/admin/students/AdminStudentAvatar'
import Pagination, { PaginationSummary } from '@/components/admin/Pagination'
import { formatApplicationDate } from '@/lib/applications/format'
import { StateWrapper } from '@/components/ui/StateWrapper'

export type StudentListEnrollment = {
  id: string
  status: string
  courseTitle: string
  intakeName: string
  enrolledAt: string | null
}

export type StudentListRow = {
  id: string
  studentDbId: string
  student_id: string
  full_name: string
  real_email: string
  phone: string
  country: string
  latestEnrolledAt: string | null
  enrollments: StudentListEnrollment[]
  profilePhotoUrl?: string | null
}

interface StudentsPageClientProps {
  students: StudentListRow[]
  fetchError?: string | null
  currentPage: number
  totalCount: number
  pageSize: number
}

export default function StudentsPageClient({
  students,
  fetchError = null,
  currentPage,
  totalCount,
  pageSize,
}: StudentsPageClientProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.student_id.toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q) ||
        s.real_email.toLowerCase().includes(q) ||
        s.enrollments.some(
          (e) =>
            e.courseTitle.toLowerCase().includes(q) ||
            e.intakeName.toLowerCase().includes(q),
        ),
    )
  }, [students, query])

  const activeCount = students.filter((s) =>
    s.enrollments.some((e) => e.status === 'active'),
  ).length

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Students</h1>
        <p className="mt-2 font-body text-sm text-[#9898B8]">
          {totalCount} enrolled students · {activeCount} with active programmes on this page
        </p>
        <p className="mt-1 font-body text-xs text-[#9898B8]">
          One row per student. Students with at least one active or completed enrollment only.
        </p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by student ID, name, email, or course"
        className="mb-6 w-full max-w-md rounded-[10px] border border-[#D8D8E8] px-4 py-3 font-body text-sm text-[#1A1A2E]"
      />

      <StateWrapper
        loading={false}
        error={fetchError}
        empty={!fetchError && filtered.length === 0}
        emptyTitle={totalCount === 0 ? 'No enrolled students yet' : 'No matching students'}
        emptyMessage={
          totalCount === 0
            ? 'Students appear here after tuition is paid and enrollment is confirmed.'
            : 'Try a different search term.'
        }
      >
        <PaginationSummary
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          className="mb-4"
        />
        <div className="overflow-hidden rounded-xl bg-white shadow-card">
          <table className="w-full min-w-[960px] text-left">
            <thead className="border-b border-[#EFEFF5] bg-[#F8F8FC]">
              <tr>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                  Student ID
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                  Name
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                  Enrollments
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                  Country
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                  Last enrolled
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-body text-sm text-[#9898B8]">
                    No students found
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="border-b border-[#EFEFF5] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AdminStudentAvatar
                          fullName={student.full_name}
                          photoUrl={student.profilePhotoUrl}
                          size="sm"
                        />
                        <span className="font-mono text-sm font-medium text-primary">
                          {student.student_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-sm font-medium text-[#1A1A2E]">
                        {student.full_name}
                      </p>
                      <p className="font-body text-xs text-[#9898B8]">{student.real_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-xs font-semibold text-[#5A5A7A]">
                        {student.enrollments.length}{' '}
                        {student.enrollments.length === 1 ? 'course' : 'courses'}
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {student.enrollments.slice(0, 3).map((enrollment) => (
                          <li
                            key={enrollment.id}
                            className="font-body text-xs text-[#9898B8]"
                          >
                            {enrollment.courseTitle}
                            <span className="text-[#D8D8E8]"> · </span>
                            {enrollment.intakeName}
                            <span className="ml-1 capitalize text-[#5A5A7A]">
                              ({enrollment.status})
                            </span>
                          </li>
                        ))}
                        {student.enrollments.length > 3 ? (
                          <li className="font-body text-xs text-[#9898B8]">
                            +{student.enrollments.length - 3} more
                          </li>
                        ) : null}
                      </ul>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#5A5A7A]">
                      {student.country}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#9898B8]">
                      {student.latestEnrolledAt
                        ? formatApplicationDate(student.latestEnrolledAt)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/students/${student.studentDbId}`}
                        className="font-body text-sm font-semibold text-primary hover:underline"
                        aria-label={`View ${student.full_name}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          className="mt-6"
        />
      </StateWrapper>
    </div>
  )
}
