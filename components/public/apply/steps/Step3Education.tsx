'use client'

import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import FormFieldLabel from '@/components/public/apply/FormFieldLabel'
import { QUALIFICATION_OPTIONS } from '@/lib/apply/constants'
import type { ApplyFieldErrors } from '@/lib/apply/validation'
import { applyFieldId } from '@/lib/apply/validation'
import type { ApplicationFormData } from '@/lib/apply/types'

interface Step3EducationProps {
  formData: Partial<ApplicationFormData>
  fieldErrors?: ApplyFieldErrors
  showValidation?: boolean
  onChange: (patch: Partial<ApplicationFormData>) => void
}

const currentYear = new Date().getFullYear()

export default function Step3Education({
  formData,
  fieldErrors = {},
  showValidation = false,
  onChange,
}: Step3EducationProps) {
  const err = (key: keyof ApplyFieldErrors) => (showValidation ? fieldErrors[key] : undefined)

  return (
    <div>
      <h2 className="font-display text-2xl text-dark">Your background.</h2>
      <p className="mb-6 mt-2 font-body text-[15px] text-gray-400">
        We do not require formal qualifications. We ask so we can better understand where you are
        coming from.
      </p>

      <div className="flex flex-col gap-4">
        <div id={applyFieldId('qualification')}>
          <FormFieldLabel required>Highest qualification</FormFieldLabel>
          <Select
            required
            aria-invalid={Boolean(err('qualification'))}
            className={
              err('qualification')
                ? 'border-[#E84A4A] focus:border-[#E84A4A] focus:ring-red-500/15'
                : undefined
            }
            value={formData.qualification ?? ''}
            onChange={(e) =>
              onChange({ qualification: e.target.value as ApplicationFormData['qualification'] })
            }
          >
            <option value="" disabled>
              Select qualification
            </option>
            {QUALIFICATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {err('qualification') && (
            <p className="mt-1.5 text-sm text-[#E84A4A]">{err('qualification')}</p>
          )}
        </div>

        <div id={applyFieldId('institution')}>
          <Input
            surface="light"
            label="Institution attended"
            required
            error={err('institution')}
            value={formData.institution ?? ''}
            onChange={(e) => onChange({ institution: e.target.value })}
          />
        </div>

        <div id={applyFieldId('yearCompleted')}>
          <Input
            surface="light"
            label="Year completed"
            type="number"
            required
            error={err('yearCompleted')}
            min={1990}
            max={currentYear}
            value={formData.yearCompleted ?? ''}
            onChange={(e) =>
              onChange({ yearCompleted: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>

        <div>
          <FormFieldLabel>Any relevant experience or skills (optional)</FormFieldLabel>
          <Textarea
            rows={4}
            placeholder="Tell us about any relevant skills, tools you use, or creative work you have done..."
            value={formData.priorExperience ?? ''}
            onChange={(e) => onChange({ priorExperience: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
