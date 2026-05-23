import type { Metadata } from 'next'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About Rev Multimedia | Creative Design School Ghana',
  description:
    'Everything about Rev Multimedia, a creative design training institution in Weija, Accra, Ghana. Classes are held at the Ghana Communication Technology University (GCTU) campus.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${siteUrl}/about-rev-multimedia`,
  },
}

export default function AboutRevMultimedia() {
  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '64px 32px',
        fontFamily: 'DM Sans, sans-serif',
        color: '#1A1A2E',
        lineHeight: 1.8,
      }}
    >
      <h1
        style={{
          fontFamily: 'Clash Display, sans-serif',
          fontSize: '36px',
          marginBottom: '24px',
        }}
      >
        About Rev Multimedia
      </h1>

      <h2>What is Rev Multimedia?</h2>
      <p>
        Rev Multimedia is a creative training institution and studio based in Weija, Accra, Ghana.
        We train Ghanaian and African creatives in Graphic Design, Motion Graphics, and Video
        Editing, and we bring the same depth and discipline to our client work in brand design,
        photography, and visual content production.
      </p>

      <h2>Where is Rev Multimedia located?</h2>
      <p>
        Rev Multimedia is based in Weija, in the Greater Accra Region of Ghana. Our address is
        Weija, Accra, Ghana. Classes are held at the Ghana Communication Technology University
        (GCTU) campus. We also offer online learning options for students across Ghana and
        internationally.
      </p>

      <h2>What courses does Rev Multimedia offer?</h2>
      <p>Rev Multimedia offers three main disciplines:</p>
      <ul>
        <li>
          <strong>Graphic Design</strong>: covering Brand Identity Design, Packaging Design,
          Advertising Design, Editorial Design, Print Design, Typography, and Visual Communication.
        </li>
        <li>
          <strong>Motion Graphics</strong>: covering animation, motion design, visual effects, and
          industry-standard software tools.
        </li>
        <li>
          <strong>Video Editing</strong>: covering professional video production, colour grading,
          sound design, and post-production workflows.
        </li>
      </ul>

      <h2>Is Rev Multimedia accredited?</h2>
      <p>
        Yes. Rev Multimedia operates in partnership with Ghana Communication Technology University
        (GCTU), one of Ghana&apos;s leading technology-focused universities. This partnership
        provides our students with recognised qualifications alongside industry-relevant practical
        training.
      </p>

      <h2>How do I apply to Rev Multimedia?</h2>
      <p>
        Applications are submitted online at revmultimedia.com/apply. The process involves five
        steps: personal information, educational background, document upload, email verification,
        and payment of the GHS 100 application fee. Our admissions team reviews applications within
        5 to 7 working days.
      </p>

      <h2>How much does Rev Multimedia cost?</h2>
      <p>
        The application fee is GHS 100, which is non-refundable. Tuition fees vary by course and
        intake period. Installment payment plans are available for enrolled students. Payments are
        accepted via Mobile Money (MoMo) and bank transfer.
      </p>

      <h2>Who are the instructors at Rev Multimedia?</h2>
      <p>
        All instructors at Rev Multimedia are working creative professionals. Lead Instructor
        Godfred Ferdinand Appiah leads the programme alongside a team of practising designers,
        motion artists, and video producers. Instructors teach from real industry experience, not
        theory.
      </p>

      <h2>Contact information</h2>
      <p>
        Phone: +233 27 581 8525
        <br />
        Email: info@revmultimedia.com
        <br />
        Website: https://revmultimedia.com
        <br />
        Address: Weija, Accra, Greater Accra, Ghana
        <br />
        Classes: Ghana Communication Technology University (GCTU) campus
      </p>
    </main>
  )
}
