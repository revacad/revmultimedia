import { LegalPageLayout } from '@/components/public/legal/LegalPageLayout'
import { LegalSection } from '@/components/public/legal/LegalSection'
import { LegalHighlight, LegalList, LegalP } from '@/components/public/legal/legal-styles'

export function TermsContent() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="Last updated: 20 May 2025"
      intro="Please read these terms carefully before applying to or enrolling at Rev Multimedia Academy."
    >
      <LegalSection number="1" title="Acceptance of Terms">
        <LegalP>
          By submitting an application or enrolling at Rev Multimedia Academy, you agree to these
          terms.
        </LegalP>
        <LegalP>If you do not agree, do not submit an application.</LegalP>
      </LegalSection>

      <LegalSection number="2" title="Application Process">
        <LegalList
          items={[
            'Applications are subject to review and approval',
            'Submission does not guarantee acceptance',
            'The application fee (GHS 100) is non-refundable in all circumstances, including if your application is rejected or you withdraw after submission',
            'You must provide accurate and truthful information',
            'Providing false information will result in immediate rejection or termination of enrollment',
          ]}
        />
        <LegalHighlight>
          <p style={{ margin: '0 0 8px' }}>
            The GHS 100 application fee is non-refundable once paid, regardless of application
            outcome.
          </p>
        </LegalHighlight>
      </LegalSection>

      <LegalSection number="3" title="Fees and Payment">
        <LegalP>
          <strong style={{ color: '#1A1A2E' }}>Application fee:</strong>
        </LegalP>
        <LegalList
          items={['GHS 100, non-refundable', 'Must be paid to complete your application']}
        />
        <LegalP>
          <strong style={{ color: '#1A1A2E' }}>Tuition fee:</strong>
        </LegalP>
        <LegalList
          items={[
            'Fees are set per intake and published on our website',
            'Fees must be paid by the due date on your invoice',
            'Late payment may result in loss of your place',
            'Installment plans are available at our discretion',
          ]}
        />
        <LegalP>
          <strong style={{ color: '#1A1A2E' }}>Refund policy:</strong>
        </LegalP>
        <LegalHighlight>
          <LegalList
            items={[
              'Tuition paid before the course start date: subject to a 20% administrative deduction',
              'Tuition paid after the course has started: non-refundable',
              'All refund requests must be submitted in writing to info@revmultimedia.com',
            ]}
          />
        </LegalHighlight>
      </LegalSection>

      <LegalSection number="4" title="Student Conduct">
        <LegalP>Students are expected to:</LegalP>
        <LegalList
          items={[
            'Attend scheduled sessions punctually',
            'Complete assignments and projects on time',
            'Treat fellow students and instructors with respect',
            'Not share course materials outside the academy',
            'Not use academy resources for illegal activities',
          ]}
        />
        <LegalP>
          Violation of these standards may result in suspension or termination without refund.
        </LegalP>
      </LegalSection>

      <LegalSection number="5" title="Intellectual Property">
        <LegalP>
          Course materials, videos, and content provided by Rev Multimedia Academy are protected by
          copyright and remain the property of the academy.
        </LegalP>
        <LegalP>
          Work created by students during the programme belongs to the student, unless created as
          part of a collaborative academy project.
        </LegalP>
      </LegalSection>

      <LegalSection number="6" title="Certificates">
        <LegalP>Certificates are issued upon:</LegalP>
        <LegalList
          items={[
            'Completion of all required coursework',
            'Full payment of all fees',
            'Meeting the minimum attendance requirements',
          ]}
        />
        <LegalP>
          Certificates remain the intellectual property of Rev Multimedia Academy and may be
          verified by third parties on request.
        </LegalP>
      </LegalSection>

      <LegalSection number="7" title="Limitation of Liability">
        <LegalP>
          Rev Multimedia Academy provides training for educational purposes. We do not guarantee
          employment outcomes.
        </LegalP>
        <LegalP>
          Our liability is limited to the amount of fees paid by the student for the current
          programme.
        </LegalP>
      </LegalSection>

      <LegalSection number="8" title="Changes to Terms">
        <LegalP>We reserve the right to update these terms.</LegalP>
        <LegalP>
          Students will be notified of significant changes via email. Continued enrollment
          constitutes acceptance of updated terms.
        </LegalP>
      </LegalSection>

      <LegalSection number="9" title="Governing Law">
        <LegalP>These terms are governed by the laws of Ghana.</LegalP>
        <LegalP>Any disputes shall be resolved under Ghanaian jurisdiction.</LegalP>
      </LegalSection>

      <LegalSection number="10" title="Contact">
        <LegalP>For questions about these terms:</LegalP>
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
