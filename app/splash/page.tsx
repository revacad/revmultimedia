import { LogoLoader } from '@/components/ui/LogoLoader'

export default function SplashPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <LogoLoader size="lg" text="Loading..." dark />

      <p
        style={{
          position: 'absolute',
          bottom: '48px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.06em',
        }}
      >
        Creative Education for the AI Era
      </p>
    </div>
  )
}
