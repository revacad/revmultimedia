import Link from 'next/link'
import Button from '@/components/ui/Button'

export const metadata = {
  title: 'Apply | Rev Multimedia Academy',
  description: 'Apply for the next cohort at Rev Multimedia Academy.',
}

export default function ApplyPage() {
  return (
    <section className="public-section public-section--muted">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-md">
        <p className="section-label">Admissions</p>
        <h1 className="mt-3 font-display text-5xl font-bold text-dark">Apply</h1>
        <p className="mx-auto mt-4 max-w-md text-brand-gray-600">
          The full application flow is coming soon. In the meantime, contact us to reserve your place.
        </p>
        <Link href="/contact" className="mt-8 inline-block">
          <Button variant="primary" size="lg">
            Contact admissions
          </Button>
        </Link>
      </div>
    </section>
  )
}
