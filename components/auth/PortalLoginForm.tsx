'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { portalLogin } from '@/actions/auth'
import { detectPortalIdentifierType } from '@/lib/auth/detect-portal-identifier'
import { PasswordInput } from '@/components/ui/PasswordInput'

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

export default function PortalLoginForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const detectedType = useMemo(() => detectPortalIdentifierType(identifier), [identifier])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await portalLogin(identifier, password, detectedType ?? undefined)
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      if (isRedirectError(err)) throw err
      setError('Invalid ID or password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label htmlFor="identifier" style={labelStyle}>
          Application reference or student ID
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter your reference or student ID"
          style={inputStyle}
        />
        <p
          style={{
            marginTop: '8px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#9898B8',
            lineHeight: 1.45,
          }}
        >
          e.g. REVAPP202600001 or REV2026000001
        </p>
        {detectedType === 'application_reference' && (
          <p
            style={{
              marginTop: '6px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#1E9990',
              lineHeight: 1.45,
            }}
          >
            Detected: Application reference
          </p>
        )}
        {detectedType === 'student_id' && (
          <p
            style={{
              marginTop: '6px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#1E9990',
              lineHeight: 1.45,
            }}
          >
            Detected: Student ID
          </p>
        )}
      </div>
      <PasswordInput
        label="Password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />

      <div style={{ textAlign: 'right' }}>
        <Link
          href="/forgot-password"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#C74A86',
            fontWeight: 600,
          }}
        >
          Forgot password?
        </Link>
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
          marginTop: '8px',
        }}
      >
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}
