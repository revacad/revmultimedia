'use client'

import {
  AdminLabel,
  AdminSettingsToggle,
  adminFieldClassName,
} from '@/components/admin/AdminFormPrimitives'

interface MaintenanceSettingsSectionProps {
  draft: Record<string, string>
  setDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onSave: () => void
  isSaved: boolean
  isPending: boolean
  saveError: string | null
}

function parseBool(value: string | undefined): boolean {
  return value === 'true' || value === '1' || value === 'on'
}

export default function MaintenanceSettingsSection({
  draft,
  setDraft,
  onSave,
  isSaved,
  isPending,
  saveError,
}: MaintenanceSettingsSectionProps) {
  const fullOn = parseBool(draft.maintenance_full)
  const portalOn = parseBool(draft.maintenance_portal)

  return (
    <div>
      <p className="mb-6 font-body text-sm leading-relaxed text-[#5A5A7A]">
        Control downtime for the public site, portal, and application flows. Admin routes are never
        blocked.
      </p>

      <div className="space-y-5">
        <AdminSettingsToggle
          id="maintenance_full"
          label="Full site maintenance"
          description="When on, all pages redirect to the maintenance screen (except admin and login)."
          checked={fullOn}
          onChange={(checked) =>
            setDraft((prev) => ({ ...prev, maintenance_full: checked ? 'true' : 'false' }))
          }
        />

        <AdminSettingsToggle
          id="maintenance_portal"
          label="Portal and applications maintenance"
          description="When on, only /portal and /apply routes redirect. Public marketing pages stay up."
          checked={portalOn}
          onChange={(checked) =>
            setDraft((prev) => ({ ...prev, maintenance_portal: checked ? 'true' : 'false' }))
          }
        />

        <div>
          <AdminLabel htmlFor="maintenance_message">Maintenance message</AdminLabel>
          <p className="mb-1 font-body text-xs text-[#9898B8]">
            Shown on the maintenance page below the heading.
          </p>
          <textarea
            id="maintenance_message"
            rows={4}
            value={draft.maintenance_message ?? ''}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, maintenance_message: e.target.value }))
            }
            className={adminFieldClassName}
          />
        </div>

        <div>
          <AdminLabel htmlFor="maintenance_deadline">Expected back online</AdminLabel>
          <p className="mb-1 font-body text-xs text-[#9898B8]">
            Optional. Shown on the maintenance page (Ghana time).
          </p>
          <input
            id="maintenance_deadline"
            type="datetime-local"
            value={toDatetimeLocalValue(draft.maintenance_deadline)}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                maintenance_deadline: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : '',
              }))
            }
            className={adminFieldClassName}
          />
        </div>
      </div>

      <div className="mt-6 flex min-h-[36px] items-center gap-3">
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
            {isPending ? 'Saving…' : 'Save'}
          </button>
        )}
        {saveError && (
          <span className="font-body text-sm text-[#E84A4A]">{saveError}</span>
        )}
      </div>
    </div>
  )
}

function toDatetimeLocalValue(iso: string | undefined): string {
  if (!iso?.trim()) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
