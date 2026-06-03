'use client'

import Input from '@/components/ui/Input'
import type { ApplyFieldErrors } from '@/lib/apply/validation'
import { applyFieldId } from '@/lib/apply/validation'
import type { ApplicationFormData } from '@/lib/apply/types'

interface LevelUpStep1ExtrasProps {
  formData: Partial<ApplicationFormData>
  fieldErrors?: ApplyFieldErrors
  showValidation?: boolean
  onChange: (patch: Partial<ApplicationFormData>) => void
}

export default function LevelUpStep1Extras({
  formData,
  fieldErrors = {},
  showValidation = false,
  onChange,
}: LevelUpStep1ExtrasProps) {
  const err = (key: keyof ApplyFieldErrors) => (showValidation ? fieldErrors[key] : undefined)

  return (
    <div className="mt-6 space-y-4 border-t border-[#EFEFF5] pt-6">
      <h3 className="font-display text-lg font-semibold text-[#1A1A2E]">Parent / guardian contact</h3>
      <p className="font-body text-sm text-[#5A5A7A]">
        We will notify your parent or guardian when you submit. They may be contacted about
        application and tuition fees.
      </p>

      <div id={applyFieldId('parentGuardianWhatsapp')}>
        <Input
          surface="light"
          label="Parent / guardian WhatsApp"
          required
          type="tel"
          placeholder="e.g. 024 123 4567"
          error={err('parentGuardianWhatsapp')}
          value={formData.parentGuardianWhatsapp ?? ''}
          onChange={(e) => onChange({ parentGuardianWhatsapp: e.target.value })}
        />
      </div>

      <div id={applyFieldId('parentGuardianEmail')}>
        <Input
          surface="light"
          label="Parent / guardian email (optional)"
          type="email"
          placeholder="parent@example.com"
          error={err('parentGuardianEmail')}
          value={formData.parentGuardianEmail ?? ''}
          onChange={(e) => onChange({ parentGuardianEmail: e.target.value })}
        />
      </div>

      <div id={applyFieldId('parentContactConsent')}>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={formData.parentContactConsent ?? false}
            onChange={(e) => onChange({ parentContactConsent: e.target.checked })}
          />
          <span className="font-body text-sm text-[#5A5A7A]">
            I confirm this parent/guardian agrees to be contacted by Rev Multimedia about this
            application and related fees.
          </span>
        </label>
        {err('parentContactConsent') && (
          <p className="mt-1.5 text-sm text-[#E84A4A]">{err('parentContactConsent')}</p>
        )}
      </div>
    </div>
  )
}
