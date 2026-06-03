'use client'

import { useEffect, useState } from 'react'
import FormFieldLabel from '@/components/public/apply/FormFieldLabel'
import { adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { applyFieldId } from '@/lib/apply/validation'

type SchoolOption = {
  id: string | null
  name: string
  region: string | null
}

interface ShsSchoolComboboxProps {
  schoolId?: string
  schoolNameFreeform?: string
  displayName?: string
  error?: string
  onChange: (patch: {
    shsSchoolId?: string
    shsSchoolNameFreeform?: string
    shsSchoolDisplayName?: string
  }) => void
}

export default function ShsSchoolCombobox({
  schoolId,
  schoolNameFreeform,
  displayName,
  error,
  onChange,
}: ShsSchoolComboboxProps) {
  const [query, setQuery] = useState(displayName ?? schoolNameFreeform ?? '')
  const [options, setOptions] = useState<SchoolOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [manualMode, setManualMode] = useState(Boolean(schoolNameFreeform && !schoolId))
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (manualMode || query.trim().length < 2) {
      setOptions([])
      setSearchError(null)
      return
    }

    const controller = new AbortController()

    const t = setTimeout(async () => {
      setLoading(true)
      setSearchError(null)
      try {
        const res = await fetch(`/api/schools/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          setOptions([])
          setSearchError('Could not load schools. You can still type your school name below.')
          return
        }
        const data = (await res.json()) as { schools?: SchoolOption[] }
        setOptions(data.schools ?? [])
        setOpen(true)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setOptions([])
        setSearchError('Could not load schools. You can still type your school name below.')
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query, manualMode])

  const selectSchool = (school: SchoolOption) => {
    setQuery(school.name)
    setManualMode(false)
    setOpen(false)
    if (school.id) {
      onChange({
        shsSchoolId: school.id,
        shsSchoolNameFreeform: undefined,
        shsSchoolDisplayName: school.name,
      })
    } else {
      onChange({
        shsSchoolId: undefined,
        shsSchoolNameFreeform: school.name,
        shsSchoolDisplayName: school.name,
      })
    }
  }

  const useManual = () => {
    setManualMode(true)
    setOpen(false)
    onChange({
      shsSchoolId: undefined,
      shsSchoolNameFreeform: query.trim(),
      shsSchoolDisplayName: query.trim(),
    })
  }

  return (
    <div id={applyFieldId('shsSchoolId')}>
      <FormFieldLabel required>Senior high school</FormFieldLabel>
      <input
        type="text"
        className={adminFieldClassName}
        placeholder="Start typing your school name"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setManualMode(false)
          onChange({
            shsSchoolId: undefined,
            shsSchoolNameFreeform: undefined,
            shsSchoolDisplayName: e.target.value,
          })
        }}
        onFocus={() => {
          if (options.length > 0) setOpen(true)
        }}
      />
      {loading && (
        <p className="mt-1 font-body text-xs text-[#9898B8]">Searching schools…</p>
      )}
      {searchError && !manualMode && (
        <p className="mt-1 font-body text-xs text-[#5A5A7A]">{searchError}</p>
      )}
      {open && options.length > 0 && !manualMode && (
        <ul className="mt-1 max-h-48 overflow-auto rounded-[10px] border border-[#D8D8E8] bg-white shadow-md">
          {options.map((school) => (
            <li key={school.id ?? school.name}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left font-body text-sm hover:bg-[#F7F8FC]"
                onClick={() => selectSchool(school)}
              >
                {school.name}
                {school.region ? (
                  <span className="ml-2 text-xs text-[#9898B8]">{school.region}</span>
                ) : null}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="w-full border-t border-[#EFEFF5] px-4 py-2.5 text-left font-body text-sm font-semibold text-primary hover:bg-[#FDF0F6]"
              onClick={useManual}
            >
              My school is not listed — use &quot;{query.trim()}&quot;
            </button>
          </li>
        </ul>
      )}
      {open && !loading && options.length === 0 && query.trim().length >= 2 && !manualMode && (
        <div className="mt-1 rounded-[10px] border border-[#D8D8E8] bg-white p-3 shadow-md">
          <p className="font-body text-sm text-[#5A5A7A]">No matches found.</p>
          <button
            type="button"
            className="mt-2 font-body text-sm font-semibold text-primary hover:underline"
            onClick={useManual}
          >
            Use &quot;{query.trim()}&quot; anyway
          </button>
        </div>
      )}
      {manualMode && (
        <p className="mt-1 font-body text-xs text-[#5A5A7A]">
          We will review your school name and add it to our list if needed.
        </p>
      )}
      {error && <p className="mt-1.5 text-sm text-[#E84A4A]">{error}</p>}
    </div>
  )
}
