import { Metadata } from 'next'
import { getPublishedOffers } from '@/lib/studentvault/data'
import TrackerClient from '@/components/studentvault/TrackerClient'

export const metadata: Metadata = {
  title: 'My StudentVault claim tracker',
  description: 'Track which student offers you have claimed.',
  robots: { index: false, follow: false },
}

export default async function TrackerPage() {
  const offers = await getPublishedOffers()

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-custom px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-2">
          My claim tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          What you have claimed, what was rejected, and what renews next.
        </p>
        <TrackerClient offers={offers} />
      </div>
    </div>
  )
}
