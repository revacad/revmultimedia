'use client'

import { useEffect, useRef } from 'react'

/** Hidden field for bots; must stay empty on real submissions. */
export default function HoneypotField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onChange('')
    if (inputRef.current) inputRef.current.value = ''

    const clearAutofill = () => {
      if (inputRef.current?.value) {
        inputRef.current.value = ''
        onChange('')
      }
    }

    const t1 = window.setTimeout(clearAutofill, 100)
    const t2 = window.setTimeout(clearAutofill, 500)
    const t3 = window.setTimeout(clearAutofill, 1500)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [onChange])

  return (
    <div
      className="pointer-events-none absolute -left-[10000px] h-0 w-0 overflow-hidden opacity-0"
      aria-hidden="true"
    >
      <input
        ref={inputRef}
        id="_hp"
        name="_hp"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore
        data-bwignore
        data-form-type="other"
        value={value}
        readOnly
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          e.target.readOnly = true
          e.target.blur()
        }}
      />
    </div>
  )
}
