'use client'

import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import FormFieldLabel from '@/components/public/apply/FormFieldLabel'
import ShsSchoolCombobox from '@/components/public/apply/ShsSchoolCombobox'
import { QUALIFICATION_OPTIONS } from '@/lib/apply/constants'
import type { ApplyFieldErrors } from '@/lib/apply/validation'
import { applyFieldId } from '@/lib/apply/validation'
import type { ApplicationChannel, ApplicationFormData } from '@/lib/apply/types'

interface Step3EducationProps {
  applicationChannel?: ApplicationChannel
  formData: Partial<ApplicationFormData>
  fieldErrors?: ApplyFieldErrors
  showValidation?: boolean
  onChange: (patch: Partial<ApplicationFormData>) => void
}

function resolveShsInstitutionName(formData: Partial<ApplicationFormData>): string {
  return (
    formData.shsSchoolDisplayName?.trim() ||
    formData.shsSchoolNameFreeform?.trim() ||
    ''
  )
}

const currentYear = new Date().getFullYear()

export default function Step3Education({
  applicationChannel = 'standard',
  formData,
  fieldErrors = {},
  showValidation = false,
  onChange,
}: Step3EducationProps) {
  const isLevelUp = applicationChannel === 'level_up'
  const err = (key: keyof ApplyFieldErrors) => (showValidation ? fieldErrors[key] : undefined)

  const handleSchoolChange = (patch: Partial<ApplicationFormData>) => {
    const institution = resolveShsInstitutionName({ ...formData, ...patch })
    onChange({
      ...patch,
      qualification: 'wassce',
      ...(institution ? { institution } : {}),
    })
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-dark">
        {isLevelUp ? 'Your education.' : 'Your background.'}
      </h2>
      <p className="mb-6 mt-2 font-body text-[15px] text-gray-400">
        {isLevelUp
          ? 'Tell us about your senior high school. We use this to understand your academic background.'
          : 'We do not require formal qualifications. We ask so we can better understand where you are coming from.'}
      </p>

      <div className="flex flex-col gap-4">
        {isLevelUp ? (
          <>
            <ShsSchoolCombobox
              schoolId={formData.shsSchoolId}
              schoolNameFreeform={formData.shsSchoolNameFreeform}
              displayName={formData.shsSchoolDisplayName ?? formData.shsSchoolNameFreeform}
              error={err('shsSchoolId')}
              onChange={handleSchoolChange}
            />

            <div id={applyFieldId('qualification')}>
              <FormFieldLabel required>Highest qualification</FormFieldLabel>
              <Input
                surface="light"
                value="WASSCE"
                readOnly
                disabled
                className="bg-[#F7F8FC] text-[#5A5A7A]"
              />
            </div>

            <div id={applyFieldId('yearCompleted')}>
              <Input
                surface="light"
                label="Year you completed (or will complete) SHS"
                type="number"
                required
                error={err('yearCompleted')}
                min={1990}
                max={currentYear + 2}
                value={formData.yearCompleted ?? ''}
                onChange={(e) =>
                  onChange({
                    yearCompleted: e.target.value ? Number(e.target.value) : undefined,
                    qualification: 'wassce',
                  })
                }
              />
            </div>
          </>
        ) : (
          <>
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
                  onChange({
                    qualification: e.target.value as ApplicationFormData['qualification'],
                  })
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
          </>
        )}

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
