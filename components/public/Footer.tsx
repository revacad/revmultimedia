'use client'

import Link from 'next/link'

export default function Footer() {
  const navigationLinks = ['Home', 'Courses', 'About', 'Apply', 'Contact']

  return (
    <footer className="public-section public-section--muted border-t border-gray-200 max-md:!py-10">
      <div className="grid grid-cols-1 gap-8 max-md:gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
        <div>
          <Link href="/" className="mb-4 flex items-center gap-0.5">
            <span className="font-display text-xl font-bold text-primary">Rev</span>
            <span className="font-display text-xl font-bold text-dark">Multimedia</span>
          </Link>
          <p className="max-w-[240px] text-sm leading-relaxed text-gray-600">
            Equipping African creatives with skills that last.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-body text-[11px] font-medium uppercase tracking-wider text-gray-400 md:text-xs">
            Navigate
          </h4>
          <div className="flex flex-col gap-3">
            {navigationLinks.map((link) => (
              <Link
                key={link}
                href={link === 'Home' ? '/' : `/${link.toLowerCase()}`}
                className="font-body text-sm text-gray-600 transition-colors hover:text-primary"
              >
                {link}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid #EFEFF5', marginTop: '8px', paddingTop: '8px' }}>
              <p
                className="mb-2 font-body text-[11px] font-medium uppercase tracking-wider"
                style={{ color: '#D8D8E8' }}
              >
                Legal
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/privacy"
                  className="font-body text-sm text-gray-600 transition-colors hover:text-primary"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="font-body text-sm text-gray-600 transition-colors hover:text-primary"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-body text-[11px] font-medium uppercase tracking-wider text-gray-400 md:text-xs">
            Get in touch
          </h4>
          <div className="flex flex-col gap-3 font-body text-sm text-gray-600">
            <a href="tel:+233275818525" className="transition-colors hover:text-primary">
              +233 27 581 8525
            </a>
            <a href="mailto:info@revmultimediagh.com" className="transition-colors hover:text-primary">
              info@revmultimediagh.com
            </a>
            <span>Weija, Accra, Ghana</span>
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-body text-[11px] font-medium uppercase tracking-wider text-gray-400 md:text-xs">
            Academic partner
          </h4>
          <p className="mb-3 font-body text-sm text-gray-600">In collaboration with</p>
          <p className="mb-3 font-body text-sm font-medium text-dark">Ghana Technology University College</p>
          <a
            href="https://gtuc.edu.gh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 px-3 py-1.5 font-body text-xs font-semibold text-accent transition-colors hover:bg-accent-light"
          >
            GTUC
          </a>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 border-t border-gray-100 pt-6 text-center md:mt-12 md:flex-row md:justify-between md:text-left">
        <p className="font-body text-sm text-gray-400">
          &copy; 2025 Rev Multimedia Academy. All rights reserved.
        </p>
        <Link
          href="/portal/login"
          className="font-body text-sm text-gray-400 transition-colors hover:text-primary"
        >
          Student Portal &rarr;
        </Link>
      </div>
    </footer>
  )
}
