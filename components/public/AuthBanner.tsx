'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/browser'

export function AuthBanner() {
  const [user, setUser] = useState<{
    firstName: string
    portalPath: string
  } | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient()

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setUser(null)
        return
      }

      const { data: student } = await supabase
        .from('students')
        .select('full_name')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      if (student?.full_name) {
        setUser({
          firstName: student.full_name.split(' ')[0] ?? 'Student',
          portalPath: '/portal/dashboard',
        })
        return
      }

      const { data: application } = await supabase
        .from('applications')
        .select('full_name')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      if (application?.full_name) {
        setUser({
          firstName: application.full_name.split(' ')[0] ?? 'Applicant',
          portalPath: '/portal/application',
        })
      } else {
        setUser(null)
      }
    }

    void checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!user) return null

  return (
    <div
      style={{
        backgroundColor: '#FDF0F6',
        borderBottom: '1px solid rgba(199,74,134,0.15)',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#C74A86',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            color: '#5A5A7A',
          }}
        >
          Welcome back, <strong style={{ color: '#C74A86' }}>{user.firstName}</strong>
        </span>
      </div>

      <Link
        href={user.portalPath}
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          color: '#C74A86',
          fontWeight: 600,
          textDecoration: 'none',
          backgroundColor: 'white',
          border: '1px solid rgba(199,74,134,0.30)',
          padding: '3px 12px',
          borderRadius: '9999px',
        }}
      >
        Go to portal
      </Link>

      <button
        type="button"
        onClick={async () => {
          const supabase = createBrowserClient()
          await supabase.auth.signOut()
          setUser(null)
        }}
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          color: '#9898B8',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </div>
  )
}
