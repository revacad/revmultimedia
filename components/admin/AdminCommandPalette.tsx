'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminNavItem } from '@/lib/admin/nav'
import { cn } from '@/lib/utils'
import { useKeyboardShortcutLabel } from '@/lib/hooks/use-keyboard-shortcut-label'

interface AdminCommandPaletteProps {
  items: AdminNavItem[]
}

export default function AdminCommandPalette({ items }: AdminCommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const shortcutLabel = useKeyboardShortcutLabel()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q),
    )
  }, [items, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const navigate = useCallback(
    (href: string) => {
      close()
      router.push(href)
    },
    [close, router],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
        return
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        close()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[12vh]"
      role="presentation"
      onClick={close}
    >
      <div className="absolute inset-0 bg-[#1A1A2E]/70" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Admin command palette"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-[#EFEFF5] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#EFEFF5] px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
              Command palette
            </p>
            <kbd className="rounded border border-[#EFEFF5] bg-[#F7F8FC] px-1.5 py-0.5 font-mono text-[10px] text-[#5A5A7A]">
              {shortcutLabel}
            </kbd>
          </div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admin pages…"
            className="w-full border-0 bg-transparent font-body text-sm text-[#1A1A2E] outline-none placeholder:text-[#9898B8]"
            autoComplete="off"
          />
        </div>
        <ul className="max-h-[min(360px,50vh)] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center font-body text-sm text-[#9898B8]">
              No matching pages
            </li>
          ) : (
            filtered.map((item) => (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => navigate(item.href)}
                  className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-[#F7F8FC]"
                >
                  <span className="font-body text-sm font-semibold text-[#1A1A2E]">
                    {item.label}
                  </span>
                  <span className="font-body text-xs text-[#9898B8]">{item.group}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-[#EFEFF5] px-4 py-2">
          <p className="font-body text-xs text-[#9898B8]">
            <kbd className={cn('rounded border border-[#EFEFF5] bg-[#F7F8FC] px-1.5 py-0.5')}>
              Esc
            </kbd>{' '}
            to close
          </p>
        </div>
      </div>
    </div>
  )
}
