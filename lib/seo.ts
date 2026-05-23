export const siteName = 'Rev Multimedia'
export const siteUrl = 'https://revmultimedia.com'
export const siteDescription =
  'Rev Multimedia is a creative training institution in Weija, Accra, Ghana. We offer professional courses in Graphic Design, Motion Graphics, Video Editing, Brand Identity Design, Packaging Design, Advertising Design, Editorial Design, and Print Design. Operating in partnership with Ghana Communication Technology University (GCTU).'

export const siteKeywords = [
  // Brand
  'Rev Multimedia',
  'Rev Multimedia Ghana',
  'Rev Multimedia Accra',
  'RevMultimedia',

  // Institution type
  'creative design school in Ghana',
  'creative design school in Accra',
  'graphic design school Ghana',
  'design school Accra',
  'creative training institution Ghana',
  'design institute Ghana',
  'creative arts school Ghana',
  'media school Ghana',
  'multimedia school Ghana',
  'design college Ghana',

  // Location
  'Weija Accra',
  'Greater Accra Ghana',
  'creative school Weija',

  // Courses
  'graphic design course Ghana',
  'graphic design training Accra',
  'motion graphics course Ghana',
  'video editing course Ghana',
  'brand identity design Ghana',
  'packaging design course Ghana',
  'print design Ghana',
  'advertising design Ghana',
  'editorial design Ghana',
  'UI UX design Ghana',
  'web design Ghana',
  'visual communication Ghana',
  'typography Ghana',
  'illustration course Ghana',

  // Profession
  'graphic designer Ghana',
  'motion designer Ghana',
  'video editor Ghana',
  'creative director Ghana',
  'brand designer Ghana',
  'visual designer Ghana',
  'UI designer Ghana',
  'UX designer Ghana',

  // Partners
  'GCTU',
  'Ghana Communication Technology University',
  'GCTU accredited design',
  'GTUC',
  'Ghana Technology University College',
  'Ghana Telecom University',
  'ghana telecom',
  'GTUC accredited design',
  'accredited design course Ghana',
  'university accredited Ghana',

  // General creative
  'creative career Ghana',
  'creative industry Ghana',
  'African creatives',
  'creative education Africa',
  'design skills Ghana',
  'portfolio training Ghana',
  'professional design training',
  'practitioner led design',
].join(', ')

export const defaultOgImage = `${siteUrl}/images/og-default.jpg`

export function buildTitle(pageTitle: string): string {
  return `${pageTitle} | Rev Multimedia`
}

export function courseTitle(courseName: string): string {
  return `${courseName} Course in Ghana | Rev Multimedia`
}

export function courseDescription(courseName: string, details: string): string {
  return `Study ${courseName} at Rev Multimedia in Accra, Ghana. ${details} Operating in partnership with Ghana Communication Technology University (GCTU). Apply now for the next intake.`
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function plainCourseDescription(
  title: string,
  rawDescription?: string | null,
): string {
  const fallback = `Learn ${title} from working professionals in Accra, Ghana.`
  if (!rawDescription) {
    return courseDescription(title, fallback)
  }
  const plain = stripHtml(rawDescription)
  return courseDescription(title, plain || fallback)
}
