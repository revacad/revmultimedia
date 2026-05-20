'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type CourseResult = {
  id: string
  title: string
  slug: string
  category: string
  tuition_fee_ghs: number
}

const categoryColors: Record<string, string> = {
  graphic_design: '#C74A86',
  motion_graphics: '#F18F3B',
  video_editing: '#2DBFB8',
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CourseResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const router = useRouter()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search/courses?q=${encodeURIComponent(query)}`)
        const data = (await res.json()) as { results?: CourseResult[] }
        setResults(data.results ?? [])
        setIsOpen(true)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <div className="relative hidden w-[280px] shrink-0 xl:block">
      <div className="relative flex items-center">
        <svg
          className="pointer-events-none absolute left-4 text-gray-400"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search courses..."
          aria-label="Search courses"
          className="w-full rounded-full border border-gray-200 bg-surface-2 py-2.5 pl-11 pr-4 text-sm text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-[1000] min-w-[300px] overflow-hidden rounded-[14px] border border-gray-100 bg-white shadow-[0_8px_40px_rgba(26,26,46,0.12)]">
          {isLoading ? (
            <div className="p-4 text-center font-body text-[13px] text-gray-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center font-body text-sm text-gray-400">
              No courses found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div>
              <div className="border-b border-gray-100 px-3 py-2 font-body text-[11px] uppercase tracking-wide text-gray-400">
                Courses
              </div>
              {results.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onMouseDown={() => {
                    router.push(`/courses/${course.slug}`)
                    setIsOpen(false)
                    setQuery('')
                  }}
                  className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2"
                >
                  <div>
                    <div className="font-body text-sm font-semibold text-dark">{course.title}</div>
                    <div
                      className="mt-1 font-body text-[11px] capitalize"
                      style={{ color: categoryColors[course.category] ?? '#9898B8' }}
                    >
                      {course.category.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="font-display text-[13px] font-semibold text-primary">
                    GHS {Number(course.tuition_fee_ghs).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
