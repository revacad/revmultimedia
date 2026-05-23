export function FaqJsonLd() {
  const faqs = [
    {
      question: 'Where is Rev Multimedia located?',
      answer:
        'Rev Multimedia is based in Weija, Accra, Ghana. Classes are held at the Ghana Communication Technology University (GCTU) campus.',
    },
    {
      question: 'What courses does Rev Multimedia offer?',
      answer:
        'Rev Multimedia offers professional courses in Graphic Design (including Brand Identity Design, Packaging Design, Advertising Design, Editorial Design, and Print Design), Motion Graphics, and Video Editing. All courses are practitioner-led and operating in partnership with Ghana Communication Technology University (GCTU).',
    },
    {
      question: 'Is Rev Multimedia accredited?',
      answer:
        "Yes. Rev Multimedia operates in partnership with Ghana Communication Technology University (GCTU), one of Ghana's leading technology-focused universities.",
    },
    {
      question: 'How much does it cost to apply to Rev Multimedia?',
      answer:
        'The application fee is GHS 100. Tuition fees vary by course and intake. Payment plans are available.',
    },
    {
      question: 'How long are the courses at Rev Multimedia?',
      answer:
        'Course durations vary. Most programmes run between 12 and 24 weeks, with flexible study modes including full-time and part-time options.',
    },
    {
      question: 'Who teaches at Rev Multimedia?',
      answer:
        'All instructors at Rev Multimedia are working creative professionals, not theorists. Lead Instructor Godfred Ferdinand Appiah and the team bring real-world industry experience to every course.',
    },
    {
      question: 'Can I study graphic design online in Ghana?',
      answer:
        'Yes. Rev Multimedia offers online and blended learning options for most courses, making it accessible to students across Ghana and internationally.',
    },
    {
      question: 'What is the difference between Rev Multimedia and other design schools in Ghana?',
      answer:
        'Rev Multimedia is practitioner-led, meaning all instructors are active industry professionals. Every module ends in portfolio-ready work. The institution operates in partnership with GCTU and focuses on skills that remain valuable in the AI era.',
    },
    {
      question: 'Does Rev Multimedia offer certificates?',
      answer:
        'Yes. Students who complete all coursework, meet attendance requirements, and clear all fees receive a certificate. Certificates are issued through the student portal and can be verified by third parties.',
    },
    {
      question: 'How do I apply to Rev Multimedia?',
      answer:
        'Apply online at revmultimedia.com/apply. Complete the five-step application form, verify your email, upload required documents, and pay the GHS 100 application fee. Our admissions team reviews applications within 5 to 7 working days.',
    },
  ]

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function LocalBusinessJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    name: 'Rev Multimedia',
    alternateName: 'RevMultimedia',
    url: 'https://revmultimedia.com',
    logo: 'https://revmultimedia.com/icons/icon-512.png',
    image: 'https://revmultimedia.com/images/og-default.jpg',
    description:
      'Rev Multimedia is a creative training institution and studio based in Weija, Accra, Ghana. We train Ghanaian and African creatives in Graphic Design, Motion Graphics, Video Editing, Brand Identity Design, Packaging Design, Advertising Design, Editorial Design, and Print Design. Operating in partnership with Ghana Communication Technology University (GCTU). Classes are held at the GCTU campus.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Weija',
      addressLocality: 'Accra',
      addressRegion: 'Greater Accra',
      postalCode: 'GA',
      addressCountry: 'GH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 5.5913,
      longitude: -0.3417,
    },
    telephone: '+233275818525',
    email: 'info@revmultimedia.com',
    priceRange: 'GHS 100 application fee',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
    sameAs: [
      'https://instagram.com/revmultimedia',
      'https://facebook.com/revmultimedia',
      'https://twitter.com/revmultimedia',
      'https://youtube.com/@revmultimedia',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Creative Design Courses in Ghana',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'Graphic Design',
            description:
              'Comprehensive Graphic Design course covering Brand Identity Design, Packaging Design, Advertising Design, Editorial Design, Print Design, Typography, and Visual Communication. Based in Accra, Ghana.',
            provider: {
              '@type': 'Organization',
              name: 'Rev Multimedia',
              sameAs: 'https://revmultimedia.com',
            },
            educationalLevel: 'Beginner to Advanced',
            availableLanguage: 'English',
            inLanguage: 'en',
            courseMode: ['In-Person', 'Online', 'Blended'],
            hasCourseInstance: {
              '@type': 'CourseInstance',
              courseMode: 'Blended',
              location: {
                '@type': 'Place',
                name: 'Ghana Communication Technology University (GCTU) campus, Accra, Ghana',
              },
            },
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'Motion Graphics',
            description:
              'Professional Motion Graphics and animation training in Accra, Ghana. Learn industry-standard tools and techniques from working motion designers.',
            provider: {
              '@type': 'Organization',
              name: 'Rev Multimedia',
              sameAs: 'https://revmultimedia.com',
            },
            educationalLevel: 'Beginner to Advanced',
            courseMode: ['In-Person', 'Online', 'Blended'],
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Course',
            name: 'Video Editing',
            description:
              'Professional Video Editing course in Accra, Ghana. Learn from working video editors and build a portfolio of real client work.',
            provider: {
              '@type': 'Organization',
              name: 'Rev Multimedia',
              sameAs: 'https://revmultimedia.com',
            },
            educationalLevel: 'Beginner to Advanced',
            courseMode: ['In-Person', 'Online', 'Blended'],
          },
        },
      ],
    },
    knowsAbout: [
      'Graphic Design',
      'Brand Identity Design',
      'Packaging Design',
      'Advertising Design',
      'Editorial Design',
      'Print Design',
      'Motion Graphics',
      'Video Editing',
      'Typography',
      'Visual Communication',
      'UI Design',
      'UX Design',
      'Creative Education',
      'Design Training Ghana',
    ],
    award: 'GCTU Academic Partner',
    foundingDate: '2020',
    foundingLocation: 'Weija, Accra, Ghana',
    areaServed: [
      {
        '@type': 'Country',
        name: 'Ghana',
      },
      {
        '@type': 'Continent',
        name: 'Africa',
      },
    ],
    slogan: 'Build Skills That Cannot Be Automated.',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/** @deprecated Use LocalBusinessJsonLd */
export function OrganizationJsonLd() {
  return <LocalBusinessJsonLd />
}

export function CourseJsonLd({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Rev Multimedia',
      sameAs: 'https://revmultimedia.com',
    },
    inLanguage: 'en',
    availableLanguage: 'English',
    educationalLevel: 'Beginner to Advanced',
    courseMode: ['In-Person', 'Online'],
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Blended',
      location: {
        '@type': 'Place',
        name: 'Rev Multimedia',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Weija, Accra',
          addressCountry: 'GH',
        },
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
