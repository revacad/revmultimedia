'use client'

import { useEffect, useState, useTransition } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { updateSettings } from '@/actions/settings'
import {
  MESSAGING_SETTING_KEYS,
  SETTINGS_HELPERS,
  SETTINGS_LABELS,
  SETTINGS_TABS,
} from '@/lib/settings/labels'
import DataExportSection from '@/components/admin/settings/DataExportSection'
import MessagingSettingsSection from '@/components/admin/settings/MessagingSettingsSection'

interface SettingsPageClientProps {
  values: Record<string, string>
}

function tabKeys(tabId: string): string[] {
  const tab = SETTINGS_TABS.find((t) => t.id === tabId)
  if (!tab) return []
  return tab.sections.flatMap((s) => [...s.keys])
}

export default function SettingsPageClient({ values }: SettingsPageClientProps) {
  const [draft, setDraft] = useState(values)
  const [savedTab, setSavedTab] = useState<string | null>(null)
  const [errorTab, setErrorTab] = useState<Record<string, string>>({})
  const [pendingTab, setPendingTab] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!savedTab) return
    const timer = setTimeout(() => setSavedTab(null), 3000)
    return () => clearTimeout(timer)
  }, [savedTab])

  function saveTab(tabId: string, keys: readonly string[] | string[]) {
    setPendingTab(tabId)
    setErrorTab((m) => ({ ...m, [tabId]: '' }))
    const updates: Record<string, string> = {}
    for (const key of keys) {
      updates[key] = draft[key] ?? ''
    }
    startTransition(async () => {
      const result = await updateSettings(updates)
      setPendingTab(null)
      if ('error' in result) {
        setErrorTab((m) => ({ ...m, [tabId]: result.error }))
      } else {
        setSavedTab(tabId)
      }
    })
  }

  function renderFields(keys: readonly string[]) {
    return (
      <div className="space-y-4">
        {keys.map((key) => (
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
    )
  }

  function renderSaveRow(tabId: string, keys: readonly string[] | string[]) {
    const isSaved = savedTab === tabId
    const isPending = pendingTab === tabId
    return (
      <div className="mt-6 flex min-h-[36px] items-center gap-3">
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
            onClick={() => saveTab(tabId, keys)}
            className="rounded-full bg-primary px-5 py-2 font-body text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        )}
        {errorTab[tabId] && (
          <span className="font-body text-sm text-[#E84A4A]">{errorTab[tabId]}</span>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[800px]">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1A1A2E]">Settings</h1>
        <p className="mt-1 font-body text-sm text-[#9898B8]">
          Manage payment details and academy configuration
        </p>
      </header>

      <Tabs.Root defaultValue="payments">
        <Tabs.List className="mb-8 flex border-b border-[#EFEFF5]">
          {SETTINGS_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className="cursor-pointer border-b-2 border-transparent px-5 py-3 font-body text-sm font-medium text-[#9898B8] transition-colors hover:text-[#1A1A2E] data-[state=active]:border-[#C74A86] data-[state=active]:text-[#C74A86]"
            >
              {tab.title}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="payments" className="pt-4">
          <div className="rounded-xl bg-white p-6 shadow-card">
            {SETTINGS_TABS.find((t) => t.id === 'payments')!.sections.map((section) => (
              <div key={section.title ?? 'fees'} className="mb-8 last:mb-0">
                {section.title && (
                  <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
                    {section.title}
                  </h2>
                )}
                {renderFields(section.keys)}
              </div>
            ))}
            {renderSaveRow('payments', tabKeys('payments'))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="academy" className="pt-4">
          <div className="rounded-xl bg-white p-6 shadow-card">
            {renderFields(tabKeys('academy'))}
            {renderSaveRow('academy', tabKeys('academy'))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="messaging" className="pt-4">
          <MessagingSettingsSection
            draft={draft}
            setDraft={setDraft}
            onSave={() => saveTab('messaging', MESSAGING_SETTING_KEYS)}
            isSaved={savedTab === 'messaging'}
            isPending={pendingTab === 'messaging'}
            saveError={errorTab.messaging ?? null}
          />
        </Tabs.Content>

        <Tabs.Content value="notifications" className="pt-4">
          <div className="rounded-xl bg-white p-6 shadow-card">
            {renderFields(tabKeys('notifications'))}
            {renderSaveRow('notifications', tabKeys('notifications'))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="security" className="pt-4">
          <div className="rounded-xl bg-white p-6 shadow-card">
            <p className="font-body text-sm text-[#9898B8]">Coming soon</p>
          </div>
        </Tabs.Content>

        <Tabs.Content value="data" className="pt-4">
          <div className="rounded-xl bg-white p-6 shadow-card">
            <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A2E]">
              Database backup
            </h2>
            <DataExportSection />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
