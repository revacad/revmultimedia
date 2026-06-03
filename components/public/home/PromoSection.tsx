'use client'

interface PromoSectionProps {
  onOpenTerms: () => void
}

export default function PromoSection({ onOpenTerms }: PromoSectionProps) {
  return (
    <div
      className="relative z-10"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '9999px',
          padding: '4px 12px',
          fontFamily: 'Clash Display, sans-serif',
          fontSize: '13px',
          fontWeight: 700,
          color: '#C74A86',
        }}
      >
        50% Off
      </div>
      <button
        type="button"
        onClick={onOpenTerms}
        className="mt-0.5 pl-1 font-body text-[9px] text-white/70 underline underline-offset-2 hover:text-white"
      >
        T&amp;C apply
      </button>
    </div>
  )
}
