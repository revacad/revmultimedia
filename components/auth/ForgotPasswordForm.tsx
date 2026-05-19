'use client'

import { useState } from 'react'
import { requestPasswordReset } from '@/actions/auth'

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

export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setIsSubmitting(true)
    try {
      const result = await requestPasswordReset(identifier, email)
      setMessage(result.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label htmlFor="identifier" style={labelStyle}>
          Student ID or Application Reference
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="REV2026000001 or REVAPP202600001"
          style={inputStyle}
        />
      </div>
      <div>
        <label htmlFor="email" style={labelStyle}>
          Registered email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
        />
      </div>

      {message && (
        <p
          role="status"
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#2DBFB8' }}
        >
          {message}
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
        {isSubmitting ? 'Sending…' : 'Send Reset Link'}
      </button>
    </form>
  )
}
