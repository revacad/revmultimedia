'use client'

import Link from 'next/link'

export default function Footer() {
  const navigationLinks = ['Home', 'Courses', 'About', 'Apply', 'Contact']

  return (
    <footer className="public-section public-section--muted border-t border-brand-gray-200">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="mb-4 flex items-center gap-0.5">
            <span className="font-display text-xl font-bold text-primary">Rev</span>
            <span className="font-display text-xl font-bold text-dark">Multimedia</span>
          </Link>
          <p className="max-w-[240px] text-sm leading-relaxed text-brand-gray-600">
            Equipping African creatives with skills that last.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-medium uppercase tracking-wider text-brand-gray-400">
            Navigate
          </h4>
          <div className="flex flex-col gap-3">
            {navigationLinks.map((link) => (
              <Link
                key={link}
                href={link === 'Home' ? '/' : `/${link.toLowerCase()}`}
                className="text-sm text-brand-gray-600 transition-colors hover:text-primary"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-medium uppercase tracking-wider text-brand-gray-400">
            Get in touch
          </h4>
          <div className="flex flex-col gap-3 text-sm text-brand-gray-600">
            <a href="tel:+233275818525" className="hover:text-primary transition-colors">
              +233 27 581 8525
            </a>
            <a href="mailto:info@revmultimediagh.com" className="hover:text-primary transition-colors">
              info@revmultimediagh.com
            </a>
            <span>Weija, Accra, Ghana</span>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-medium uppercase tracking-wider text-brand-gray-400">
            Academic partner
          </h4>
          <p className="mb-3 text-sm text-brand-gray-600">In collaboration with</p>
          <p className="mb-3 text-sm font-medium text-dark">Ghana Technology University College</p>
          <a
            href="https://gtuc.edu.gh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent-light transition-colors"
          >
            GTUC
          </a>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-brand-gray-100 pt-6 md:flex-row">
        <p className="text-sm text-brand-gray-400">
          &copy; 2025 Rev Multimedia Academy. All rights reserved.
        </p>
        <Link href="/portal/login" className="text-sm text-brand-gray-400 hover:text-primary transition-colors">
          Student Portal &rarr;
        </Link>
      </div>
    </footer>
  )
}
