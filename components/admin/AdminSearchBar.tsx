'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type AdminSearchResults = {
  students: { id: string; student_id: string; full_name: string }[]
  applications: { id: string; reference: string; full_name: string; status: string }[]
  courses: { id: string; title: string; slug: string }[]
}

export default function AdminSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminSearchResults | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const router = useRouter()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setResults(null)
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search/admin?q=${encodeURIComponent(query)}`)
        const data = (await res.json()) as { results?: AdminSearchResults }
        setResults(data.results ?? { students: [], applications: [], courses: [] })
        setIsOpen(true)
      } catch {
        setResults({ students: [], applications: [], courses: [] })
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const hasResults =
    results &&
    (results.students.length > 0 ||
      results.applications.length > 0 ||
      results.courses.length > 0)

  return (
    <div className="relative w-full max-w-[320px]">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => hasResults && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder="Search students, applications…"
        className="w-full rounded-lg border border-[#EFEFF5] bg-[#F7F8FC] px-3 py-2 font-body text-sm text-[#1A1A2E] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 z-[1000] max-h-[400px] w-[360px] overflow-y-auto rounded-xl border border-[#EFEFF5] bg-white shadow-[0_8px_40px_rgba(26,26,46,0.12)]">
          {isLoading ? (
            <p className="p-4 text-center font-body text-sm text-[#9898B8]">Searching…</p>
          ) : !hasResults ? (
            <p className="p-4 text-center font-body text-sm text-[#9898B8]">No results</p>
          ) : (
            <>
              {results!.students.length > 0 && (
                <div>
                  <p className="border-b border-[#EFEFF5] px-3 py-2 font-body text-[11px] font-semibold uppercase text-[#9898B8]">
                    Students
                  </p>
                  {results!.students.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => {
                        router.push(`/admin/students/${s.id}`)
                        setIsOpen(false)
                      }}
                      className="block w-full border-b border-[#EFEFF5] px-4 py-2.5 text-left hover:bg-[#F7F8FC]"
                    >
                      <p className="font-body text-sm font-medium text-[#1A1A2E]">{s.full_name}</p>
                      <p className="font-mono text-xs text-[#9898B8]">{s.student_id}</p>
                    </button>
                  ))}
                </div>
              )}
              {results!.applications.length > 0 && (
                <div>
                  <p className="border-b border-[#EFEFF5] px-3 py-2 font-body text-[11px] font-semibold uppercase text-[#9898B8]">
                    Applications
                  </p>
                  {results!.applications.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onMouseDown={() => {
                        router.push(`/admin/applications/${a.id}`)
                        setIsOpen(false)
                      }}
                      className="block w-full border-b border-[#EFEFF5] px-4 py-2.5 text-left hover:bg-[#F7F8FC]"
                    >
                      <p className="font-body text-sm font-medium text-[#1A1A2E]">{a.full_name}</p>
                      <p className="font-mono text-xs text-[#C74A86]">{a.reference}</p>
                    </button>
                  ))}
                </div>
              )}
              {results!.courses.length > 0 && (
                <div>
                  <p className="border-b border-[#EFEFF5] px-3 py-2 font-body text-[11px] font-semibold uppercase text-[#9898B8]">
                    Courses
                  </p>
                  {results!.courses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => {
                        router.push(`/admin/courses/${c.id}`)
                        setIsOpen(false)
                      }}
                      className="block w-full px-4 py-2.5 text-left hover:bg-[#F7F8FC]"
                    >
                      <p className="font-body text-sm font-medium text-[#1A1A2E]">{c.title}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
