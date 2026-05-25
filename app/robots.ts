import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/courses',
          '/courses/',
          '/about',
          '/contact',
          '/apply',
          '/privacy',
          '/terms',
          '/about-rev-multimedia',
          '/sitemap.xml',
          '/manifest.json',
          '/icons/',
          '/images/',
        ],
        disallow: [
          '/admin/',
          '/portal/',
          '/api/',
          '/_next/',
          '/login',
          '/forgot-password',
          '/reset-password',
          '/book',
          '/disqualified',
          '/thanks',
          '/opt-in',
          '/tmp/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/courses', '/about', '/contact'],
        disallow: ['/admin/', '/portal/', '/api/', '/tmp/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/courses', '/about', '/contact'],
        disallow: ['/admin/', '/portal/', '/api/', '/tmp/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/courses', '/about', '/contact'],
        disallow: ['/admin/', '/portal/', '/api/', '/tmp/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/portal/',
          '/api/',
          '/book',
          '/disqualified',
          '/thanks',
          '/opt-in',
          '/tmp/',
        ],
      },
    ],
    sitemap: 'https://revmultimedia.com/sitemap.xml',
    host: 'https://revmultimedia.com',
  }
}
