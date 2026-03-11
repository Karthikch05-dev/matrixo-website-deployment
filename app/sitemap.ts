import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://matrixo.in'
  
  // Static pages
  const staticPages = [
    '',
    '/events',
    '/services',
    '/about',
    '/team',
    '/contact',
    '/auth',
    '/privacy',
    '/terms',
    '/refund',
    '/data-protection',
  ]

  // Generate sitemap entries for static pages
  const staticEntries = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return staticEntries
}
