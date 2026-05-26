'use client'

import { useState } from 'react'
import { changeAdminPassword } from '@/actions/admin-auth'
import { PasswordInput } from '@/components/ui/PasswordInput'

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const result = await changeAdminPassword(currentPassword, password, confirmPassword)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      setCurrentPassword('')
      setPassword('')
      setConfirmPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-md space-y-4">
      <p className="font-body text-sm text-[#5A5A7A]">
        Enter your current password, then choose a new one (at least 8 characters).
      </p>

      <PasswordInput
        label="Current password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={setCurrentPassword}
      />

      <PasswordInput
        label="New password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      />

      <PasswordInput
        label="Confirm new password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={
          confirmPassword && confirmPassword !== password
            ? 'Passwords do not match'
            : undefined
        }
      />

      {error && (
        <p role="alert" className="font-body text-sm text-[#E84A4A]">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="font-body text-sm text-[#1E9990]">
          Your password has been updated.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-primary px-6 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
