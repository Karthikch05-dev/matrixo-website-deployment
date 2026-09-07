import { MetadataRoute } from 'next'
import { getPublishedOffers } from '@/lib/studentvault/data'

const baseUrl = 'https://matrixo.in'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    '/studentvault',
    '/studentvault/expired',
  ]

  // Generate sitemap entries for static pages
  const staticEntries = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // StudentVault offer and category pages. Gated routes (/unlock, /vault,
  // /tracker) are deliberately excluded — they are noindex.
  let studentVaultEntries: MetadataRoute.Sitemap = []

  try {
    const offers = await getPublishedOffers()

    const offerEntries = offers.map((offer) => ({
      url: `${baseUrl}/studentvault/${offer.slug}`,
      lastModified: offer.lastVerifiedAt ? new Date(offer.lastVerifiedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const categories = Array.from(
      new Set(offers.map((o) => o.category).filter(Boolean))
    )
    const categoryEntries = categories.map((category) => ({
      url: `${baseUrl}/studentvault/category/${encodeURIComponent(category)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    studentVaultEntries = [...offerEntries, ...categoryEntries]
  } catch (error) {
    // A Firestore outage must not break the whole sitemap.
    console.error('[sitemap] Could not load StudentVault offers:', error)
  }

  return [...staticEntries, ...studentVaultEntries]
}
