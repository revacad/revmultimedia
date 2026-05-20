'use client'

import { useState } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import Link from 'next/link'
import { acceptAdminInvite } from '@/actions/admin'
import { PasswordInput } from '@/components/ui/PasswordInput'

interface AcceptInviteFormProps {
  token: string
  fullName?: string
}

export default function AcceptInviteForm({ token, fullName }: AcceptInviteFormProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await acceptAdminInvite(token, password)
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      if (isRedirectError(err)) throw err
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {fullName && (
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            color: '#5A5A7A',
            marginBottom: '4px',
          }}
        >
          Welcome, <strong style={{ color: '#1A1A2E' }}>{fullName}</strong>
        </p>
      )}
      <PasswordInput
        label="Password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      />
      <PasswordInput
        label="Confirm password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
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
          marginTop: '8px',
        }}
      >
        {isSubmitting ? 'Creating account…' : 'Create Account'}
      </button>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#9898B8', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link href="/admin/login" style={{ color: '#C74A86', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
