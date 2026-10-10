import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Section'
import { getPublishedOffers } from '@/lib/studentvault/data'
import VaultClient, { VaultSkeleton } from '@/components/studentvault/VaultClient'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Your StudentVault',
  description: 'Your StudentVault pass, verification, claim links and tracker.',
  robots: { index: false, follow: false },
}

export default async function VaultPage() {
  // Offer facts are public. Links, guides and claims are fetched client-side
  // through APIs that check the pass and student verification.
  const offers = await getPublishedOffers()

  return (
    <Container className="pb-24 pt-10 sm:pt-14">
      <Link href="/studentvault" className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> StudentVault
      </Link>
      <h1 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[44px]">Your vault</h1>
      <p className="mt-2 max-w-2xl text-[17px] text-muted">Every perk you can claim, the official links, and what to do next.</p>
      <div className="mt-8">
        <Suspense fallback={<VaultSkeleton />}>
          <VaultClient offers={offers} />
        </Suspense>
      </div>
    </Container>
  )
}
