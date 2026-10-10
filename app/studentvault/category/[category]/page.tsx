import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Section'
import { getPublishedOffers } from '@/lib/studentvault/data'
import { getDisplayPrice } from '@/lib/studentvault/pricing'
import PerkGrid from '@/components/studentvault/PerkGrid'
import { BuyPassButton } from '@/components/studentvault/BuyPass'

export const revalidate = 3600

type Props = { params: { category: string } }

export async function generateStaticParams() {
  const offers = await getPublishedOffers().catch(() => [])
  const categories = Array.from(new Set(offers.map((o) => o.category).filter(Boolean)))
  return categories.map((category) => ({ category: encodeURIComponent(category) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = decodeURIComponent(params.category)
  return {
    title: `${category}: free student perks in India`,
    description: `${category} perks, credits and discounts for students in India — what you get, who qualifies and how to claim.`,
    alternates: { canonical: `/studentvault/category/${params.category}` },
  }
}

export default async function CategoryPage({ params }: Props) {
  const category = decodeURIComponent(params.category)
  const [all, price] = await Promise.all([getPublishedOffers(), getDisplayPrice()])
  const offers = all.filter((o) => o.category === category && o.status !== 'ended')
  if (offers.length === 0) notFound()

  const totalValue = offers.reduce((sum, o) => sum + (o.valueInr || 0), 0)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'StudentVault', item: 'https://matrixo.in/studentvault' },
      { '@type': 'ListItem', position: 2, name: category, item: `https://matrixo.in/studentvault/category/${params.category}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container className="pb-24 pt-10 sm:pt-14">
        <Link href="/studentvault" className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All perks
        </Link>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[48px]">{category}</h1>
            <p className="mt-3 text-[17px] text-muted">
              {offers.length} perk{offers.length === 1 ? '' : 's'} for students in India
              {totalValue > 0 ? `, worth about ₹${totalValue.toLocaleString('en-IN')} together.` : '.'}
            </p>
          </div>
          <BuyPassButton price={price} size="md" className="lg:w-72" fullWidth />
        </div>
        <div className="mt-10">
          <PerkGrid offers={offers} />
        </div>
      </Container>
    </>
  )
}
