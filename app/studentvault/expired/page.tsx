import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Section'
import { getPublishedOffers } from '@/lib/studentvault/data'
import PerkGrid from '@/components/studentvault/PerkGrid'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Ended and changed student offers',
  description:
    'Student offers that have ended or changed, kept on record so you know what happened and what to use instead.',
  alternates: { canonical: '/studentvault/expired' },
}

export default async function ExpiredArchivePage() {
  const all = await getPublishedOffers()
  const archived = all.filter((o) => o.status === 'ended' || o.status === 'changed')

  return (
    <Container className="pb-24 pt-10 sm:pt-14">
      <Link href="/studentvault" className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All perks
      </Link>
      <h1 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[48px]">Ended and changed</h1>
      <p className="mt-3 max-w-2xl text-[17px] text-muted">
        We never quietly delete a perk. When a provider ends or changes a student offer, we note what changed so you aren’t left
        following a dead link.
      </p>
      <div className="mt-10">
        {archived.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-6 py-14 text-center text-[15px] text-muted">
            Nothing here yet — every perk is currently live.
          </p>
        ) : (
          <PerkGrid offers={archived} />
        )}
      </div>
    </Container>
  )
}
