import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://revmultimedia.com'
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/apply`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about-rev-multimedia`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()
    const { data: courses } = await supabase
      .from('courses')
      .select('slug, updated_at, title')
      .eq('is_published', true)

    const coursePages: MetadataRoute.Sitemap = (courses || []).map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: new Date(course.updated_at || now),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))

    return [...staticPages, ...coursePages]
  } catch {
    return staticPages
  }
}
