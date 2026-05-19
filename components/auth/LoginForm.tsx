'use client'

import { useState } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { loginAdmin } from '@/actions/auth'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await loginAdmin(email, password)
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      if (isRedirectError(err)) throw err
      setError('Invalid email or password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label
          htmlFor="email"
          style={{
            display: 'block',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: '#5A5A7A',
            marginBottom: '6px',
          }}
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@revmultimediagh.com"
          style={{
            width: '100%',
            padding: '13px 16px',
            border: '1.5px solid #D8D8E8',
            borderRadius: '10px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            color: '#1A1A2E',
            outline: 'none',
            backgroundColor: 'white',
          }}
        />
      </div>
      <div>
        <label
          htmlFor="password"
          style={{
            display: 'block',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: '#5A5A7A',
            marginBottom: '6px',
          }}
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{
            width: '100%',
            padding: '13px 16px',
            border: '1.5px solid #D8D8E8',
            borderRadius: '10px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            color: '#1A1A2E',
            outline: 'none',
            backgroundColor: 'white',
          }}
        />
      </div>

      {error && (
        <p
          role="alert"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#E84A4A',
          }}
        >
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
