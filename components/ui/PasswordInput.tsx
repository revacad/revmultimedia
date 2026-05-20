'use client'

import { useState } from 'react'

interface PasswordInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  name?: string
  autoComplete?: string
  id?: string
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder = '••••••••',
  error,
  name,
  autoComplete,
  id,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)
  const inputId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          color: '#5A5A7A',
          marginBottom: '6px',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          name={name}
          autoComplete={autoComplete}
          style={{
            width: '100%',
            padding: '13px 48px 13px 16px',
            border: `1.5px solid ${error ? '#E84A4A' : '#D8D8E8'}`,
            borderRadius: '10px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px',
            color: '#1A1A2E',
            outline: 'none',
            backgroundColor: 'white',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9898B8',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px',
            color: '#E84A4A',
            marginTop: '5px',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
