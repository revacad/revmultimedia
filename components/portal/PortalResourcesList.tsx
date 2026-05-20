'use client'

import { useMemo, useState } from 'react'
import PortalResourceDownloadButton from '@/components/portal/PortalResourceDownloadButton'
import { formatFileSize } from '@/lib/apply/upload'
import { formatDate } from '@/lib/utils'

export type PortalResource = {
  id: string
  title: string
  description: string | null
  file_type: 'pdf' | 'image'
  file_size: number | null
  created_at: string
}

type FileFilter = 'all' | 'pdf' | 'image'

function FileTypeIcon({ type }: { type: 'pdf' | 'image' }) {
  if (type === 'pdf') {
    return (
      <div className="flex h-10 w-10 items-center justify-center text-[#DC2626]">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
    )
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center text-[#1E9990]">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  )
}

export default function PortalResourcesList({ resources }: { resources: PortalResource[] }) {
  const [filter, setFilter] = useState<FileFilter>('all')

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (filter === 'pdf') return r.file_type === 'pdf'
      if (filter === 'image') return r.file_type === 'image'
      return true
    })
  }, [resources, filter])

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl bg-white px-8 py-16 text-center shadow-card">
        <div className="mb-4 text-[#9898B8]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        </div>
        <p className="font-body text-[15px] font-medium text-[#1A1A2E]">No resources available yet</p>
        <p className="mt-2 max-w-sm font-body text-sm text-[#9898B8]">
          Resources will appear here when your instructors upload them.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-3">
        {(['all', 'pdf', 'image'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 font-body text-sm transition-colors ${
              filter === f
                ? 'bg-[#FDF0F6] font-semibold text-[#C74A86]'
                : 'bg-white text-[#5A5A7A] shadow-card'
            }`}
          >
            {f === 'all' ? 'All' : f === 'pdf' ? 'PDFs' : 'Images'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((resource) => (
          <article key={resource.id} className="rounded-xl bg-white p-5 shadow-card">
            <FileTypeIcon type={resource.file_type} />
            <h2 className="mt-3 font-body text-[15px] font-semibold text-[#1A1A2E]">
              {resource.title}
            </h2>
            {resource.description && (
              <p className="mt-1 line-clamp-2 font-body text-[13px] text-[#9898B8]">
                {resource.description}
              </p>
            )}
            <p className="mt-3 font-body text-xs text-[#9898B8]">
              {resource.file_size != null ? formatFileSize(resource.file_size) : '—'}
              {' · '}
              {formatDate(resource.created_at)}
            </p>
            <PortalResourceDownloadButton resourceId={resource.id} />
          </article>
        ))}
      </div>
    </>
  )
}
