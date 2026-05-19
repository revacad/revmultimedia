'use client'

import { useState, useTransition } from 'react'
import Button from '@/components/ui/Button'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { updateSettings } from '@/actions/settings'
import { SETTINGS_LABELS, SETTINGS_SECTIONS } from '@/lib/settings/labels'

interface SettingsPageClientProps {
  values: Record<string, string>
}

export default function SettingsPageClient({ values }: SettingsPageClientProps) {
  const [draft, setDraft] = useState(values)
  const [sectionMessage, setSectionMessage] = useState<Record<string, string>>({})
  const [pendingSection, setPendingSection] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function saveSection(sectionId: string, keys: readonly string[]) {
    setPendingSection(sectionId)
    setSectionMessage((m) => ({ ...m, [sectionId]: '' }))
    const updates: Record<string, string> = {}
    for (const key of keys) {
      updates[key] = draft[key] ?? ''
    }
    startTransition(async () => {
      const result = await updateSettings(updates)
      setPendingSection(null)
      if ('error' in result) {
        setSectionMessage((m) => ({ ...m, [sectionId]: result.error }))
      } else {
        setSectionMessage((m) => ({ ...m, [sectionId]: 'Saved' }))
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
        {SETTINGS_SECTIONS.map((section) => (
          <section key={section.id} className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.keys.map((key) => (
                <div key={key}>
                  <AdminLabel htmlFor={key}>
                    {SETTINGS_LABELS[key] ?? key}
                  </AdminLabel>
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
            <div className="mt-4 flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={pendingSection === section.id}
                onClick={() => saveSection(section.id, section.keys)}
              >
                {pendingSection === section.id ? 'Saving…' : 'Save'}
              </Button>
              {sectionMessage[section.id] && (
                <span className="font-body text-sm text-[#9898B8]">
                  {sectionMessage[section.id]}
                </span>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
