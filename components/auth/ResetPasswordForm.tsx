'use client'

import { useState } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { confirmPasswordReset } from '@/actions/auth'
import { PasswordInput } from '@/components/ui/PasswordInput'

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await confirmPasswordReset(token, password)
      if (result?.error) setError(result.error)
    } catch (err) {
      if (isRedirectError(err)) throw err
      setError('Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PasswordInput
        label="New password"
        name="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      />
      <PasswordInput
        label="Confirm password"
        name="confirm"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        error={confirm && confirm !== password ? 'Passwords do not match' : undefined}
      />

      {error && (
        <p role="alert" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#E84A4A' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: isSubmitting ? '#EFEFF5' : '#C74A86',
          color: isSubmitting ? '#9898B8' : 'white',
          border: 'none',
          borderRadius: '9999px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '15px',
          fontWeight: 600,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'Saving…' : 'Reset Password'}
      </button>
    </form>
  )
}
