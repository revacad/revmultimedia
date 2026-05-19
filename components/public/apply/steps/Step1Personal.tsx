'use client'

import { useEffect, useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { COUNTRIES, GHANA_REGIONS, GENDER_OPTIONS } from '@/lib/apply/constants'
import type { ApplicationFormData } from '@/lib/apply/types'

interface Step1PersonalProps {
  formData: Partial<ApplicationFormData>
  emailVerified: boolean
  onChange: (patch: Partial<ApplicationFormData>) => void
  onEmailVerified: (verified: boolean) => void
}

export default function Step1Personal({
  formData,
  emailVerified,
  onChange,
  onEmailVerified,
}: Step1PersonalProps) {
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendAvailable, setResendAvailable] = useState(false)

  const email = (formData.email ?? '').trim()
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const sendCodeDisabled = !isValidEmail || isSendingOtp

  const isGhana = formData.country === 'Ghana'

  useEffect(() => {
    if (!otpSent) return
    setResendAvailable(false)
    const t = setTimeout(() => setResendAvailable(true), 30_000)
    return () => clearTimeout(t)
  }, [otpSent])

  const sendCode = async () => {
    if (!isValidEmail) return
    setIsSendingOtp(true)
    setOtpError(null)
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setOtpError(data.error ?? 'Failed to send code')
        return
      }
      setOtpSent(true)
    } catch {
      setOtpError('Failed to send code')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const verifyCode = async () => {
    if (!isValidEmail || otpCode.length !== 6) return
    setVerifying(true)
    setOtpError(null)
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
      })
      const data = (await res.json()) as { valid?: boolean; reason?: string }
      if (data.valid === true) {
        onEmailVerified(true)
        setOtpSent(false)
        setOtpCode('')
        setOtpError(null)
      } else {
        const messages: Record<string, string> = {
          expired: 'Code expired. Please request a new one.',
          invalid_code: 'Invalid code. Please try again.',
          too_many_attempts: 'Too many attempts. Please request a new code.',
        }
        setOtpError(messages[data.reason ?? ''] ?? 'Verification failed')
      }
    } catch {
      setOtpError('Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-dark">Tell us about yourself.</h2>
      <p className="mb-6 mt-2 font-body text-[15px] text-gray-400">
        This information will be used to create your student profile. Please ensure everything is accurate.
      </p>

      <div className="flex flex-col gap-4">
        <Input
          surface="light"
          label="Full legal name"
          required
          value={formData.fullName ?? ''}
          onChange={(e) => onChange({ fullName: e.target.value })}
        />

        <Input
          surface="light"
          label="Date of birth"
          type="date"
          required
          value={formData.dateOfBirth ?? ''}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
        />

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Gender</label>
          <Select
            required
            value={formData.gender ?? ''}
            onChange={(e) =>
              onChange({ gender: e.target.value as ApplicationFormData['gender'] })
            }
          >
            <option value="" disabled>
              Select gender
            </option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
            Country of residence
          </label>
          <Select
            required
            value={formData.country ?? ''}
            onChange={(e) =>
              onChange({
                country: e.target.value,
                stateRegion: undefined,
                city: undefined,
              })
            }
          >
            <option value="" disabled>
              Select country
            </option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <Input
          surface="light"
          label="Phone number"
          required
          value={formData.phone ?? ''}
          placeholder={isGhana ? '05X XXX XXXX' : '+1 234 567 8900'}
          onChange={(e) => onChange({ phone: e.target.value })}
        />

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                surface="light"
                label="Email address"
                type="email"
                required
                disabled={emailVerified}
                value={formData.email ?? ''}
                onChange={(e) => {
                  onChange({ email: e.target.value })
                  onEmailVerified(false)
                  setOtpSent(false)
                  setOtpCode('')
                }}
              />
            </div>
            {!emailVerified && (
              <button
                type="button"
                className="shrink-0 rounded-full px-7 py-3.5 text-base font-semibold transition-all duration-200"
                disabled={sendCodeDisabled}
                onClick={() => void sendCode()}
                style={{
                  backgroundColor: sendCodeDisabled ? '#EFEFF5' : '#C74A86',
                  color: sendCodeDisabled ? '#9898B8' : '#ffffff',
                  opacity: sendCodeDisabled ? 1 : 1,
                  cursor: sendCodeDisabled ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
              >
                {isSendingOtp ? 'Sending…' : otpSent ? 'Resend Code' : 'Send Code'}
              </button>
            )}
          </div>
          {emailVerified && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#2DBFB8]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Email verified
            </p>
          )}
          {otpSent && !emailVerified && (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-sm text-gray-500">
                We sent a 6-digit code to {formData.email}. Enter it below to verify your email.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  surface="light"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={otpCode.length !== 6 || verifying}
                  onClick={() => void verifyCode()}
                >
                  {verifying ? 'Verifying…' : 'Verify'}
                </Button>
              </div>
              {otpError && <p className="text-sm text-red-500">{otpError}</p>}
              {resendAvailable && (
                <button
                  type="button"
                  className="text-left text-sm text-primary underline"
                  onClick={() => void sendCode()}
                >
                  Resend code
                </button>
              )}
            </div>
          )}
        </div>

        <Input
          surface="light"
          label="Residential address"
          required
          value={formData.address ?? ''}
          onChange={(e) => onChange({ address: e.target.value })}
        />

        {isGhana ? (
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-600">Region</label>
            <Select
              required
              value={formData.stateRegion ?? ''}
              onChange={(e) => onChange({ stateRegion: e.target.value })}
            >
              <option value="" disabled>
                Select region
              </option>
              {GHANA_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        ) : formData.country ? (
          <>
            <Input
              surface="light"
              label="State / Province"
              required
              value={formData.stateRegion ?? ''}
              onChange={(e) => onChange({ stateRegion: e.target.value })}
            />
            <Input
              surface="light"
              label="City"
              required
              value={formData.city ?? ''}
              onChange={(e) => onChange({ city: e.target.value })}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
