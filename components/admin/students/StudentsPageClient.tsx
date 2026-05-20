'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatApplicationDate } from '@/lib/applications/format'
import { formatCategory } from '@/lib/courses/labels'
import type { CourseCategory } from '@/lib/courses/types'

export type StudentListRow = {
  id: string
  student_id: string
  full_name: string
  real_email: string
  phone: string
  country: string
  created_at: string
  is_active: boolean
  enrollments: {
    status: string
    courses: { title: string; category: CourseCategory } | null
  }[]
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
        s.student_id.toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q) ||
        s.real_email.toLowerCase().includes(q),
    )
  }, [students, query])

  const activeCount = students.filter((s) => s.is_active).length
  const completedCount = students.filter((s) =>
    s.enrollments.some((e) => e.status === 'completed'),
  ).length

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Students</h1>
        <p className="mt-2 font-body text-sm text-[#9898B8]">
          Total {students.length} · Active {activeCount} · Completed {completedCount}
        </p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by student ID, name, or email"
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
                Course
              </th>
              <th className="px-4 py-3 font-body text-xs font-semibold uppercase text-[#9898B8]">
                Enrolled
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
                <td colSpan={7} className="px-4 py-8 text-center font-body text-sm text-[#9898B8]">
                  No students found
                </td>
              </tr>
            ) : (
              filtered.map((student) => {
                const enrollment = student.enrollments[0]
                const course = enrollment?.courses
                const status = enrollment?.status ?? (student.is_active ? 'active' : 'inactive')

                return (
                  <tr key={student.id} className="border-b border-[#EFEFF5] last:border-0">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-primary">
                      {student.student_id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-sm font-medium text-[#1A1A2E]">
                        {student.full_name}
                      </p>
                      <p className="font-body text-xs text-[#9898B8]">{student.real_email}</p>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#5A5A7A]">{student.country}</td>
                    <td className="px-4 py-3 font-body text-sm text-[#5A5A7A]">
                      {course ? (
                        <>
                          {course.title}
                          <span className="mt-0.5 block text-xs text-[#9898B8]">
                            {formatCategory(course.category)}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-[#9898B8]">
                      {formatApplicationDate(student.created_at)}
                    </td>
                    <td className="px-4 py-3 font-body text-sm capitalize text-[#5A5A7A]">
                      {status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="font-body text-sm font-semibold text-primary hover:underline"
                      >
                        View
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
