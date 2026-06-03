'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type ApplicationPickerItem = {
  id: string
  reference: string
  courseTitle: string | null
}

export default function ApplicationPicker({
  items,
  embedded = false,
}: {
  items: ApplicationPickerItem[]
  embedded?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedId = searchParams.get('applicationId') ?? items[0]?.id ?? ''

  const options = useMemo(
    () =>
      items.map((a) => ({
        id: a.id,
        label: a.courseTitle ? `${a.reference} · ${a.courseTitle}` : a.reference,
      })),
    [items],
  )

  return (
    <div
      className={
        embedded
          ? 'min-w-[200px]'
          : 'mb-6 rounded-xl border border-[#EFEFF5] bg-white p-4 shadow-card'
      }
    >
      <label className="block font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
        Select application
      </label>
      <select
        value={selectedId}
        onChange={(e) => {
          const id = e.target.value
          const next = new URLSearchParams(searchParams.toString())
          next.set('applicationId', id)
          router.replace(`${pathname}?${next.toString()}`)
        }}
        className="mt-2 w-full rounded-lg border border-[#D8D8E8] bg-white px-3 py-2 font-body text-sm text-[#1A1A2E] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

