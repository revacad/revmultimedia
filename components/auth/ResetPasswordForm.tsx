'use client'

import { useState } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { confirmPasswordReset } from '@/actions/auth'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  border: '1.5px solid #D8D8E8',
  borderRadius: '10px',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '15px',
  color: '#1A1A2E',
  outline: 'none',
  backgroundColor: 'white',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: '13px',
  fontWeight: 600,
  color: '#5A5A7A',
  marginBottom: '6px',
}

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
      <div>
        <label htmlFor="password" style={labelStyle}>
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div>
        <label htmlFor="confirm" style={labelStyle}>
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={inputStyle}
        />
      </div>

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
