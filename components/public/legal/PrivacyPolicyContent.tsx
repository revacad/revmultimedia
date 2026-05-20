import { LegalPageLayout } from '@/components/public/legal/LegalPageLayout'
import { LegalSection } from '@/components/public/legal/LegalSection'
import { LegalList, LegalP } from '@/components/public/legal/legal-styles'

export function PrivacyPolicyContent() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="Last updated: 20 May 2025"
      intro="Rev Multimedia Academy is committed to protecting your privacy and handling your data responsibly."
    >
      <LegalSection number="1" title="Who We Are">
        <LegalP>
          <strong style={{ color: '#1A1A2E' }}>Rev Multimedia Academy</strong>
        </LegalP>
        <LegalP>Location: Weija, Accra, Ghana</LegalP>
        <LegalP>
          Email:{' '}
          <a href="mailto:info@revmultimedia.com" style={{ color: '#C74A86' }}>
            info@revmultimedia.com
          </a>
        </LegalP>
        <LegalP>Phone: +233 27 581 8525</LegalP>
        <LegalP>
          We are the data controller for information collected through revmultimedia.com and our
          student portal.
        </LegalP>
      </LegalSection>

      <LegalSection number="2" title="Information We Collect">
        <LegalP>
          <strong style={{ color: '#1A1A2E' }}>When you apply:</strong>
        </LegalP>
        <LegalList
          items={[
            'Full name, date of birth, gender',
            'Email address and phone number',
            'Residential address and region',
            'Educational background',
            'Identity documents (Ghana Card or Passport)',
            'Passport photograph',
            'Supporting certificates',
          ]}
        />
        <LegalP>
          <strong style={{ color: '#1A1A2E' }}>When you use our portal:</strong>
        </LegalP>
        <LegalList
          items={[
            'Login activity and timestamps',
            'Documents you upload',
            'Payment information (processed securely via Paystack)',
            'Communications with our team',
          ]}
        />
        <LegalP>
          <strong style={{ color: '#1A1A2E' }}>Automatically collected:</strong>
        </LegalP>
        <LegalList
          items={[
            'IP address and device information',
            'Browser type and usage data',
            'Pages visited on our website',
          ]}
        />
      </LegalSection>

      <LegalSection number="3" title="How We Use Your Information">
        <LegalList
          items={[
            'Processing your application and enrollment',
            'Communicating about your application status',
            'Sending invoices and payment confirmations',
            'Issuing your Student ID and certificates',
            'Sending important academy announcements',
            'Improving our website and services',
            'Complying with legal obligations in Ghana',
          ]}
        />
      </LegalSection>

      <LegalSection number="4" title="How We Share Your Information">
        <LegalP>We do not sell your personal data.</LegalP>
        <LegalP>We may share with:</LegalP>
        <LegalList
          items={[
            <>
              <strong style={{ color: '#1A1A2E' }}>Ghana Technology University College (GTUC)</strong>{' '}
              — our academic partner, for enrollment verification
            </>,
            <>
              <strong style={{ color: '#1A1A2E' }}>Paystack</strong> — for payment processing
            </>,
            <>
              <strong style={{ color: '#1A1A2E' }}>Cloudflare</strong> — for secure file storage
            </>,
            <>
              <strong style={{ color: '#1A1A2E' }}>Resend</strong> — for email delivery
            </>,
          ]}
        />
        <LegalP>All third parties are contractually required to protect your data.</LegalP>
      </LegalSection>

      <LegalSection number="5" title="Data Storage and Security">
        <LegalP>Your data is stored securely using:</LegalP>
        <LegalList
          items={[
            'Supabase (PostgreSQL database with encryption at rest)',
            'Cloudflare R2 (encrypted file storage)',
            'SSL/TLS encryption for all data in transit',
          ]}
        />
        <LegalP>
          We retain your data for as long as you are a student or applicant, plus 7 years for legal
          and financial records as required under Ghanaian law.
        </LegalP>
      </LegalSection>

      <LegalSection number="6" title="Your Rights">
        <LegalP>You have the right to:</LegalP>
        <LegalList
          items={[
            'Access your personal data',
            'Request correction of inaccurate data',
            'Request deletion of your data (subject to legal retention requirements)',
            'Withdraw consent for marketing communications',
            'Lodge a complaint with the relevant authority',
          ]}
        />
        <LegalP>
          To exercise these rights, contact us at{' '}
          <a href="mailto:info@revmultimedia.com" style={{ color: '#C74A86' }}>
            info@revmultimedia.com
          </a>
        </LegalP>
      </LegalSection>

      <LegalSection number="7" title="Cookies">
        <LegalP>We use essential cookies only:</LegalP>
        <LegalList
          items={[
            'Authentication cookies (to keep you logged in)',
            'Security cookies (to prevent cross-site attacks)',
          ]}
        />
        <LegalP>We do not use advertising or tracking cookies.</LegalP>
      </LegalSection>

      <LegalSection number="8" title="Changes to This Policy">
        <LegalP>We may update this policy periodically.</LegalP>
        <LegalP>
          Changes will be posted on this page with an updated date. Continued use of our services
          constitutes acceptance of the updated policy.
        </LegalP>
      </LegalSection>

      <LegalSection number="9" title="Contact Us">
        <LegalP>For privacy-related questions:</LegalP>
        <LegalP>
          Email:{' '}
          <a href="mailto:info@revmultimedia.com" style={{ color: '#C74A86' }}>
            info@revmultimedia.com
          </a>
        </LegalP>
        <LegalP>Address: Rev Multimedia Academy, Weija, Accra, Ghana</LegalP>
      </LegalSection>
    </LegalPageLayout>
  )
}
