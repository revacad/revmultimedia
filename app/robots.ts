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
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/courses', '/about', '/contact'],
        disallow: ['/admin/', '/portal/', '/api/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/courses', '/about', '/contact'],
        disallow: ['/admin/', '/portal/', '/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/courses', '/about', '/contact'],
        disallow: ['/admin/', '/portal/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/portal/', '/api/'],
      },
    ],
    sitemap: 'https://revmultimedia.com/sitemap.xml',
    host: 'https://revmultimedia.com',
  }
}
