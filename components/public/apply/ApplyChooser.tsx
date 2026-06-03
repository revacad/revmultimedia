'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ApplyQuoteCard from '@/components/public/apply/ApplyQuoteCard'
import { cn } from '@/lib/utils'
import Input from '@/components/ui/Input'
import { verifyReturnStudent } from '@/actions/verify-return-student'
import { isValidPermanentStudentId } from '@/lib/students/lookup-returning'
import type { Quote } from '@/lib/quotes'

interface ApplyChooserProps {
  quote: Quote
}

const NOT_FOUND_MESSAGE =
  'No student found with that ID. If you are new, select No to apply.'

export default function ApplyChooser({ quote }: ApplyChooserProps) {
  const [returning, setReturning] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [debouncedId, setDebouncedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [enrollmentCount, setEnrollmentCount] = useState<number | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const debouncedIdComplete = isValidPermanentStudentId(debouncedId)

  useEffect(() => {
    if (!returning) return
    const timer = window.setTimeout(() => {
      setDebouncedId(studentId.trim().toUpperCase())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [studentId, returning])

  useEffect(() => {
    if (!returning) return

    if (!debouncedIdComplete) {
      setLoading(false)
      setFirstName(null)
      setEnrollmentCount(null)
      setNotFound(false)
      setLookupError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setLookupError(null)

    const timeoutPromise = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('timeout')), 10_000)
    })

    void (async () => {
      try {
        const result = await Promise.race([
          verifyReturnStudent(debouncedId),
          timeoutPromise,
        ])
        if (cancelled) return
        setLoading(false)
        if (result.found && result.firstName) {
          setFirstName(result.firstName)
          setEnrollmentCount(result.enrollmentCount ?? 0)
          setNotFound(false)
        } else {
          setFirstName(null)
          setEnrollmentCount(null)
          setNotFound(true)
        }
      } catch (err) {
        if (cancelled) return
        setLoading(false)
        setFirstName(null)
        setEnrollmentCount(null)
        setNotFound(false)
        if (err instanceof Error && err.message === 'timeout') {
          setLookupError('Lookup timed out. Proceed as a new applicant or try again.')
        } else {
          setLookupError('Something went wrong. Please try again.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debouncedId, debouncedIdComplete, returning])

  function handleReturningToggle(next: boolean) {
    setReturning(next)
    if (!next) {
      setStudentId('')
      setDebouncedId('')
      setLoading(false)
      setFirstName(null)
      setEnrollmentCount(null)
      setNotFound(false)
      setLookupError(null)
    }
  }

  return (
    <section className="min-h-[min(100vh,920px)] bg-[#F7F8FC] px-4 py-10 sm:py-12 lg:py-14">
      <div className="mx-auto w-full max-w-[736px]">
        <h1 className="font-display text-[26px] font-semibold leading-tight text-[#1A1A2E] sm:text-3xl">
          Apply to Rev Multimedia
        </h1>
        <p className="mt-2 max-w-[540px] font-body text-sm text-[#5A5A7A] sm:mt-3 sm:text-[15px]">
          {returning
            ? 'Already enrolled? Enter your student ID to sign in to the portal.'
            : 'Choose the application path that fits you. Both use the same courses and intakes for now.'}
        </p>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#EFEFF5] bg-white px-4 py-3.5 shadow-card sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-5">
          <span className="font-body text-sm font-medium text-[#1A1A2E] sm:text-[15px]">
            Are you a Returning student?
          </span>
          <div className="flex items-center justify-end gap-2.5 sm:justify-start">
            <span
              className={cn(
                'min-w-[1.75rem] text-right text-sm font-semibold transition-colors',
                !returning ? 'text-[#1A1A2E]' : 'text-[#9898B8]',
              )}
              aria-hidden
            >
              No
            </span>
            <label className="inline-flex shrink-0 cursor-pointer items-center">
              <span className="sr-only">
                {returning ? 'Yes, returning student' : 'No, new applicant'}
              </span>
              <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
                <input
                  type="checkbox"
                  checked={returning}
                  onChange={(e) => handleReturningToggle(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-[#D8D8E8] transition-colors peer-checked:bg-[#C74A86] peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30" />
                <span className="absolute left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
            <span
              className={cn(
                'min-w-[1.75rem] text-sm font-semibold transition-colors',
                returning ? 'text-[#1A1A2E]' : 'text-[#9898B8]',
              )}
              aria-hidden
            >
              Yes
            </span>
          </div>
        </div>

        {returning ? (
          <div className="mt-4 sm:mt-5">
            <Input
              surface="light"
              label="Enter your student ID"
              placeholder="REV2026000001"
              helperText="REV + year + 6 digits"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value.toUpperCase())
                setLookupError(null)
              }}
              autoComplete="off"
              spellCheck={false}
            />

            {loading && debouncedIdComplete ? (
              <p className="mt-3 font-body text-sm text-[#5A5A7A]">Looking up your record…</p>
            ) : null}

            {lookupError && debouncedIdComplete && !loading ? (
              <p className="mt-3 font-body text-sm text-[#C1121F]" role="alert">
                {lookupError}
              </p>
            ) : null}

            {notFound && debouncedIdComplete && !loading && !lookupError ? (
              <p className="mt-3 font-body text-sm text-[#C1121F]" role="alert">
                {NOT_FOUND_MESSAGE}
              </p>
            ) : null}

            {firstName && !loading ? (
              <article className="mt-4 overflow-hidden rounded-xl border border-[#EFEFF5] bg-white shadow-card sm:mt-5 sm:rounded-2xl">
                <div className="border-b border-[#EFEFF5] bg-[#F7F8FC] px-4 py-4 sm:px-5">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-[#9898B8]">
                    Student found
                  </p>
                  <p className="mt-2 font-body text-[15px] leading-relaxed text-[#1A1A2E]">
                    Welcome back, {firstName}! You have{' '}
                    {enrollmentCount ?? 0} enrollment{(enrollmentCount ?? 0) === 1 ? '' : 's'}.
                    Please sign in to your portal to apply for another course.
                  </p>
                </div>
                <div className="p-4 sm:p-5">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-white transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-glow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Sign in to portal
                  </Link>
                </div>
              </article>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-4">
            <article className="group relative flex flex-col overflow-hidden rounded-xl border border-[#EFEFF5] bg-white shadow-card sm:rounded-2xl">
              <div className="relative h-[120px] sm:h-[120px]">
                <Image
                  src="/images/standard-application.jpg"
                  alt="Standard application"
                  fill
                  sizes="(max-width: 640px) 100vw, 360px"
                  className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,26,46,0)_0%,rgba(26,26,46,0.28)_100%)]" />
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h2 className="font-display text-lg font-semibold text-[#1A1A2E] sm:text-xl">
                  Standard application
                </h2>
                <p className="mt-1.5 flex-1 font-body text-[13px] leading-relaxed text-[#5A5A7A] sm:text-sm">
                  For general applicants, career changers, and anyone ready to start a creative
                  programme.
                </p>
                <Link
                  href="/apply/standard"
                  className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-white transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-glow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:mt-5 sm:py-3"
                >
                  Continue
                </Link>
              </div>
            </article>

            <article className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-[#C74A86] bg-white shadow-card sm:rounded-2xl">
              <div className="relative h-[120px]">
                <Image
                  src="/images/level-up.jpg"
                  alt="Level Up application"
                  fill
                  sizes="(max-width: 640px) 100vw, 360px"
                  className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,26,46,0)_0%,rgba(26,26,46,0.28)_100%)]" />
                <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-white/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[11px]">
                  SHS students
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h2 className="font-display text-lg font-semibold text-[#1A1A2E] sm:text-xl">
                  Level Up
                </h2>
                <p className="mt-1.5 flex-1 font-body text-[13px] leading-relaxed text-[#5A5A7A] sm:text-sm">
                  For senior high school students in Africa.
                </p>
                <Link
                  href="/apply/level-up"
                  className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-white transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-glow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:mt-5 sm:py-3"
                >
                  Level Up application
                </Link>
              </div>
            </article>
          </div>
        )}

        <ApplyQuoteCard quote={quote} />
      </div>
    </section>
  )
}
