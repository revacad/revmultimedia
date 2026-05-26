'use client'

import { useState } from 'react'
import { requestAdminPasswordReset } from '@/actions/admin-auth'

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

export default function AdminForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setIsSubmitting(true)
    try {
      const result = await requestAdminPasswordReset(email)
      setMessage(result.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label htmlFor="email" style={labelStyle}>
          Admin email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@revmultimediagh.com"
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
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
