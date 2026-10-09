import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedOffers } from '@/lib/studentvault/data'
import OfferCard from '@/components/studentvault/OfferCard'

export const revalidate = 3600

type Props = { params: { category: string } }

export async function generateStaticParams() {
  const offers = await getPublishedOffers().catch(() => [])
  const categories = Array.from(new Set(offers.map((o) => o.category).filter(Boolean)))
  return categories.map((category) => ({ category: encodeURIComponent(category) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = decodeURIComponent(params.category)
  const url = `https://matrixo.in/studentvault/category/${params.category}`

  return {
    title: `${category} — free student offers in India`,
    description: `Verified ${category.toLowerCase()} offers, credits and discounts available free to students in India. Every listing links to the official provider.`,
    alternates: { canonical: url },
  }
}

export default async function CategoryPage({ params }: Props) {
  const category = decodeURIComponent(params.category)
  const all = await getPublishedOffers()
  const offers = all.filter((o) => o.category === category)

  if (offers.length === 0) notFound()

  const totalValue = offers.reduce((sum, o) => sum + (o.valueInr || 0), 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'StudentVault',
        item: 'https://matrixo.in/studentvault',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category,
        item: `https://matrixo.in/studentvault/category/${params.category}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            {category} for students in India
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
            {offers.length} verified {category.toLowerCase()} offer
            {offers.length === 1 ? '' : 's'} available to Indian students
            {totalValue > 0
              ? `, worth approximately ₹${totalValue.toLocaleString('en-IN')} in total.`
              : '.'}{' '}
            Each one links directly to the official provider.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
