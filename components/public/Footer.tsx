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
          <div className="mt-4 flex gap-3">
            {[
              {
                href: 'https://instagram.com/revmultimedia',
                label: 'Instagram',
                svg: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                ),
              },
              {
                href: 'https://facebook.com/revmultimedia',
                label: 'Facebook',
                svg: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                ),
              },
              {
                href: 'https://twitter.com/revmultimedia',
                label: 'X (Twitter)',
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ),
              },
              {
                href: 'https://youtube.com/@revmultimedia',
                label: 'YouTube',
                svg: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                  </svg>
                ),
              },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 no-underline transition-colors duration-200 hover:bg-primary hover:text-white"
              >
                {social.svg}
              </a>
            ))}
          </div>
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
          &copy; 2026 Rev Multimedia. All rights reserved.
        </p>
        <Link
          href="/login"
          className="font-body text-sm text-gray-400 transition-colors hover:text-primary"
        >
          Student Portal &rarr;
        </Link>
      </div>
    </footer>
  )
}
