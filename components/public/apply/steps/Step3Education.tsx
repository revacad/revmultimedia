'use client'

import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { QUALIFICATION_OPTIONS } from '@/lib/apply/constants'
import type { ApplicationFormData } from '@/lib/apply/types'

interface Step3EducationProps {
  formData: Partial<ApplicationFormData>
  onChange: (patch: Partial<ApplicationFormData>) => void
}

const currentYear = new Date().getFullYear()

export default function Step3Education({ formData, onChange }: Step3EducationProps) {
  return (
    <div>
      <h2 className="font-display text-2xl text-dark">Your background.</h2>
      <p className="mb-6 mt-2 font-body text-[15px] text-gray-400">
        We do not require formal qualifications. We ask so we can better understand where you are coming
        from.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
            Highest qualification
          </label>
          <Select
            required
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
        </div>

        <Input
          surface="light"
          label="Institution attended"
          required
          value={formData.institution ?? ''}
          onChange={(e) => onChange({ institution: e.target.value })}
        />

        <Input
          surface="light"
          label="Year completed"
          type="number"
          required
          min={1990}
          max={currentYear}
          value={formData.yearCompleted ?? ''}
          onChange={(e) =>
            onChange({ yearCompleted: e.target.value ? Number(e.target.value) : undefined })
          }
        />

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
            Any relevant experience or skills (optional)
          </label>
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
