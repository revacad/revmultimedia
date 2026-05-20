'use client'

import { useState, useTransition } from 'react'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { sendTestSms } from '@/actions/communications'

interface MessagingSettingsSectionProps {
  draft: Record<string, string>
  setDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onSave: () => void
  isSaved: boolean
  isPending: boolean
  saveError: string | null
}

export default function MessagingSettingsSection({
  draft,
  setDraft,
  onSave,
  isSaved,
  isPending,
  saveError,
}: MessagingSettingsSectionProps) {
  const [testPhone, setTestPhone] = useState(draft.academy_phone ?? '')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [pendingTest, startTest] = useTransition()

  const provider = draft.sms_provider || 'sentdm'

  function runTestSms() {
    setTestResult(null)
    startTest(async () => {
      const result = await sendTestSms(testPhone)
      if ('error' in result) {
        setTestResult(result.error)
      } else {
        setTestResult('Test sent!')
      }
    })
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-card">
      <p className="mb-4 font-body text-xs text-[#9898B8]">
        WhatsApp always uses Sent.dm regardless of SMS provider. Runtime provider is read from
        system settings (cached); SMS_PROVIDER env is the fallback.
      </p>

      <p className="mb-3 font-body text-sm font-medium text-[#1A1A2E]">SMS provider</p>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setDraft((d) => ({ ...d, sms_provider: 'sentdm' }))}
          className={`rounded-xl border-2 p-4 text-left transition-colors ${
            provider === 'sentdm'
              ? 'border-[#C74A86] bg-[#FDF0F6]'
              : 'border-[#EFEFF5] bg-white hover:border-[#D8D8E8]'
          }`}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#EBF9F8] font-display text-sm font-bold text-[#1E9990]">
            SD
          </div>
          <p className="font-body text-sm font-semibold text-[#1A1A2E]">Sent.dm</p>
          <p className="mt-1 font-body text-xs text-[#9898B8]">
            Supports SMS and WhatsApp
          </p>
        </button>

        <button
          type="button"
          onClick={() => setDraft((d) => ({ ...d, sms_provider: 'fishafrica' }))}
          className={`rounded-xl border-2 p-4 text-left transition-colors ${
            provider === 'fishafrica'
              ? 'border-[#C74A86] bg-[#FDF0F6]'
              : 'border-[#EFEFF5] bg-white hover:border-[#D8D8E8]'
          }`}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEF6EE] font-display text-sm font-bold text-[#C4701E]">
            FA
          </div>
          <p className="font-body text-sm font-semibold text-[#1A1A2E]">
            Fish Africa (letsfish.africa)
          </p>
          <p className="mt-1 font-body text-xs text-[#9898B8]">
            Ghana-based, supports bulk SMS
          </p>
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-[#EFEFF5] p-4">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
            Sent.dm
          </p>
          <div>
            <AdminLabel htmlFor="sentdm_api_key">API key</AdminLabel>
            <input
              id="sentdm_api_key"
              type="password"
              value={draft.sentdm_api_key ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, sentdm_api_key: e.target.value }))
              }
              className={adminFieldClassName}
              autoComplete="off"
            />
          </div>
          <div>
            <AdminLabel htmlFor="sentdm_sender_id">Sender ID</AdminLabel>
            <input
              id="sentdm_sender_id"
              value={draft.sentdm_sender_id ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, sentdm_sender_id: e.target.value }))
              }
              className={adminFieldClassName}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-[#EFEFF5] p-4">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-[#9898B8]">
            Fish Africa
          </p>
          <div>
            <AdminLabel htmlFor="fishafrica_api_key">API key</AdminLabel>
            <input
              id="fishafrica_api_key"
              type="password"
              value={draft.fishafrica_api_key ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, fishafrica_api_key: e.target.value }))
              }
              className={adminFieldClassName}
              autoComplete="off"
            />
          </div>
          <div>
            <AdminLabel htmlFor="fishafrica_sender_id">Sender ID</AdminLabel>
            <input
              id="fishafrica_sender_id"
              value={draft.fishafrica_sender_id ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, fishafrica_sender_id: e.target.value }))
              }
              className={adminFieldClassName}
            />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <AdminLabel htmlFor="test-sms-phone">Test phone number</AdminLabel>
          <input
            id="test-sms-phone"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className={adminFieldClassName}
            placeholder="+233…"
          />
        </div>
        <button
          type="button"
          disabled={pendingTest}
          onClick={runTestSms}
          className="rounded-full border border-[#D8D8E8] bg-white px-5 py-2 font-body text-sm font-semibold text-[#1A1A2E] disabled:opacity-50"
        >
          {pendingTest ? 'Sending…' : 'Test SMS'}
        </button>
        {testResult && (
          <span
            className={`font-body text-sm font-semibold ${
              testResult === 'Test sent!' ? 'text-[#1E9990]' : 'text-[#E84A4A]'
            }`}
          >
            {testResult}
          </span>
        )}
      </div>

      <div className="flex min-h-[36px] items-center gap-3">
        {isSaved ? (
          <span className="inline-flex items-center gap-2 font-body text-sm font-semibold text-[#1E9990]">
            Saved
          </span>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={onSave}
            className="rounded-full bg-primary px-5 py-2 font-body text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save Messaging Settings'}
          </button>
        )}
        {saveError && (
          <span className="font-body text-sm text-[#E84A4A]">{saveError}</span>
        )}
      </div>
    </section>
  )
}
