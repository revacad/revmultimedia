const COUNTRY_FLAGS: Record<string, string> = {
  Ghana: '🇬🇭',
  Nigeria: '🇳🇬',
  'United Kingdom': '🇬🇧',
  UK: '🇬🇧',
  'United States': '🇺🇸',
  USA: '🇺🇸',
  Canada: '🇨🇦',
  Germany: '🇩🇪',
  France: '🇫🇷',
}

const QUALIFICATION_LABELS: Record<string, string> = {
  wassce: 'WASSCE',
  hnd: 'HND',
  degree: "Bachelor's Degree",
  masters: "Master's Degree",
  other: 'Other',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  prefer_not_to_say: 'Prefer not to say',
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  national_id: 'National ID',
  passport: 'Passport',
  passport_photo: 'Passport Photo',
  certificate: 'Certificate',
  admission_letter: 'Admission letter',
  other: 'Other',
}

export function formatApplicationDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? '🌍'
}

export function formatQualification(value: string): string {
  return QUALIFICATION_LABELS[value] ?? value
}

export function formatGender(value: string): string {
  return GENDER_LABELS[value] ?? value
}

export function formatDocumentType(value: string): string {
  return DOCUMENT_TYPE_LABELS[value] ?? value
}

export function daysSince(date: string): number {
  const start = new Date(date).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)))
}
