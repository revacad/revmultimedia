'use client'

import { useEffect, useState, useTransition } from 'react'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { updateSettings } from '@/actions/settings'
import { SETTINGS_HELPERS, SETTINGS_LABELS, SETTINGS_SECTIONS } from '@/lib/settings/labels'

interface SettingsPageClientProps {
  values: Record<string, string>
}

export default function SettingsPageClient({ values }: SettingsPageClientProps) {
  const [draft, setDraft] = useState(values)
  const [savedSection, setSavedSection] = useState<string | null>(null)
  const [errorSection, setErrorSection] = useState<Record<string, string>>({})
  const [pendingSection, setPendingSection] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!savedSection) return
    const timer = setTimeout(() => setSavedSection(null), 3000)
    return () => clearTimeout(timer)
  }, [savedSection])

  function saveSection(sectionId: string, keys: readonly string[]) {
    setPendingSection(sectionId)
    setErrorSection((m) => ({ ...m, [sectionId]: '' }))
    const updates: Record<string, string> = {}
    for (const key of keys) {
      updates[key] = draft[key] ?? ''
    }
    startTransition(async () => {
      const result = await updateSettings(updates)
      setPendingSection(null)
      if ('error' in result) {
        setErrorSection((m) => ({ ...m, [sectionId]: result.error }))
      } else {
        setSavedSection(sectionId)
      }
    })
  }

  return (
    <div className="mx-auto max-w-[800px]">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Settings</h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Manage payment details and academy configuration
        </p>
      </header>

      <div className="space-y-6">
        {SETTINGS_SECTIONS.map((section) => {
          const isSaved = savedSection === section.id
          const isPending = pendingSection === section.id

          return (
            <section key={section.id} className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.keys.map((key) => (
                  <div key={key}>
                    <AdminLabel htmlFor={key}>{SETTINGS_LABELS[key] ?? key}</AdminLabel>
                    {SETTINGS_HELPERS[key] && (
                      <p className="mb-1 font-body text-xs text-[#9898B8]">
                        {SETTINGS_HELPERS[key]}
                      </p>
                    )}
                    <input
                      id={key}
                      value={draft[key] ?? ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className={adminFieldClassName}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex min-h-[36px] items-center gap-3">
                {isSaved ? (
                  <span className="inline-flex items-center gap-2 font-body text-sm font-semibold text-[#1E9990]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => saveSection(section.id, section.keys)}
                    className="rounded-full bg-primary px-5 py-2 font-body text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {isPending ? 'Saving…' : `Save ${section.title}`}
                  </button>
                )}
                {errorSection[section.id] && (
                  <span className="font-body text-sm text-[#E84A4A]">
                    {errorSection[section.id]}
                  </span>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
