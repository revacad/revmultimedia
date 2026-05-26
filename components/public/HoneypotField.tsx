'use client'

/** Hidden field for bots; must stay empty on real submissions. */
export default function HoneypotField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
    >
      <label htmlFor="website">Website</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
