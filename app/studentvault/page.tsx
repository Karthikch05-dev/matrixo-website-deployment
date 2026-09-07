import { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedOffers } from '@/lib/studentvault/data'
import { getProductBreakdown } from '@/lib/products'
import CatalogBrowser from '@/components/studentvault/CatalogBrowser'
import { daysUntil } from '@/lib/studentvault/types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'StudentVault — Free & Discounted Student Tools in India',
  description:
    'A continuously verified directory of free and discounted tools, cloud credits, certifications and internships for Indian students. Browse the catalog free — every offer links to the official provider.',
  alternates: { canonical: 'https://matrixo.in/studentvault' },
  openGraph: {
    title: 'StudentVault — Verified student benefits for India',
    description:
      'Free and discounted tools, credits and certifications for Indian students, verified and dated.',
    url: 'https://matrixo.in/studentvault',
    siteName: 'matriXO',
  },
}

export default async function StudentVaultPage() {
  const offers = await getPublishedOffers()
  const breakdown = getProductBreakdown('studentvault')

  const liveOffers = offers.filter((o) => o.status !== 'ended')
  const totalValue = liveOffers.reduce((sum, o) => sum + (o.valueInr || 0), 0)
  const expiringSoon = liveOffers.filter((o) => {
    const d = daysUntil(o.expiresOn)
    return d !== null && d >= 0 && d <= 30
  }).length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'StudentVault',
    description:
      'Verified directory of free and discounted student benefits available in India.',
    url: 'https://matrixo.in/studentvault',
    isPartOf: {
      '@type': 'WebSite',
      name: 'matriXO',
      url: 'https://matrixo.in',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen pt-24 pb-20">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <header className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">
              matriXO StudentVault
            </p>
            <h1 className="text-3xl md:text-5xl font-display font-bold gradient-text mb-4">
              Everything you can get free as a student in India
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-6">
              A continuously verified directory of free and discounted tools, cloud
              credits, certifications and internships for Indian students. The catalog
              is free and every offer links straight to the official provider — we
              never sell accounts, codes or subscriptions.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/studentvault/unlock" className="btn-primary inline-flex">
                Unlock claim guides — ₹{breakdown?.total ?? 104}
              </Link>
              <Link href="/studentvault/expired" className="btn-secondary inline-flex">
                View archive
              </Link>
            </div>
          </header>

          {/* Stats */}
          {offers.length > 0 && (
            <section
              aria-label="Catalog summary"
              className="grid gap-4 sm:grid-cols-3 mb-12"
            >
              <div className="glass-card p-5">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {liveOffers.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Verified offers available
                </p>
              </div>
              <div className="glass-card p-5">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ≈ ₹{totalValue.toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estimated claimable value
                </p>
              </div>
              <div className="glass-card p-5">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {expiringSoon}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Expiring within 30 days
                </p>
              </div>
            </section>
          )}

          {/* Catalog */}
          <section aria-label="Student offers">
            <h2 className="sr-only">Browse student offers</h2>
            {offers.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  The catalog is being verified
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Offers appear here once a matriXO team member has checked them
                  against the provider&apos;s official source. Nothing is listed
                  before it is verified.
                </p>
              </div>
            ) : (
              <CatalogBrowser offers={offers} />
            )}
          </section>

          {/* Trust / legal */}
          <section className="glass-card p-6 mt-12 max-w-3xl">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
              How StudentVault works
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              StudentVault is a curated research and tracking service. Every offer
              listed here is free and available directly from the provider — we link
              to the official page every time. Your ₹{breakdown?.basePrice ?? 99} pays
              for our verification work, the step-by-step claim guides, the deadline
              alerts and your personal tracker. We do not sell, resell or provide
              accounts, coupon codes or subscriptions, and we are not affiliated with
              any provider listed.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
