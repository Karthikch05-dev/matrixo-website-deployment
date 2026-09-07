import { Metadata } from 'next'
import { getPublishedOffers } from '@/lib/studentvault/data'
import VaultClient from '@/components/studentvault/VaultClient'

export const metadata: Metadata = {
  title: 'Your StudentVault',
  description: 'Your StudentVault command centre.',
  robots: { index: false, follow: false },
}

export default async function VaultPage() {
  // Offer data is public; only the playbook, sprint and claims are gated, and
  // those are fetched client-side through the entitlement-checked API.
  const offers = await getPublishedOffers()

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-2">
          Your Vault
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Everything you need to actually claim what you are entitled to.
        </p>
        <VaultClient offers={offers} />
      </div>
    </div>
  )
}
