import { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedOffers } from '@/lib/studentvault/data'
import OfferCard from '@/components/studentvault/OfferCard'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Ended & changed student offers — StudentVault archive',
  description:
    'Student offers that have ended or materially changed, kept on record so you know what happened and when it was last verified.',
  alternates: { canonical: 'https://matrixo.in/studentvault/expired' },
}

export default async function ExpiredArchivePage() {
  const all = await getPublishedOffers()
  const archived = all.filter((o) => o.status === 'ended' || o.status === 'changed')

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <Link
            href="/studentvault"
            className="text-gray-500 dark:text-gray-400 hover:underline"
          >
            ← All StudentVault offers
          </Link>
        </nav>

        <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
          Ended &amp; changed student offers
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
          Offers are never quietly deleted. When a provider ends or changes a student
          benefit we record what changed and when we last verified it, so you are not
          left following a dead link.
        </p>

        {archived.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Nothing archived yet — every verified offer is currently live.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
