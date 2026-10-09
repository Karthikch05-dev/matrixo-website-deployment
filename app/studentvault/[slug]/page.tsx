import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FaExternalLinkAlt, FaExclamationTriangle } from 'react-icons/fa'
import {
  getPublishedOfferBySlug,
  getPublishedOffers,
} from '@/lib/studentvault/data'
import { getProductBreakdown } from '@/lib/products'
import {
  CardRequiredBadge,
  DeadlineBadge,
  StatusBadge,
  VerifiedBadge,
} from '@/components/studentvault/OfferBadges'
import OfferCard from '@/components/studentvault/OfferCard'

export const revalidate = 3600

type Props = { params: { slug: string } }

export async function generateStaticParams() {
  const offers = await getPublishedOffers().catch(() => [])
  return offers.map((offer) => ({ slug: offer.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await getPublishedOfferBySlug(params.slug)
  if (!offer) return { title: 'Offer not found — StudentVault' }

  const url = `https://matrixo.in/studentvault/${offer.slug}`

  return {
    title: `${offer.name} for students in India — how to claim it`,
    description: offer.summary.slice(0, 158),
    alternates: { canonical: url },
    openGraph: {
      title: `${offer.name} — student offer explained`,
      description: offer.summary.slice(0, 158),
      url,
      siteName: 'matriXO',
      type: 'article',
      modifiedTime: offer.lastVerifiedAt ?? offer.updatedAt ?? undefined,
    },
  }
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function OfferPage({ params }: Props) {
  const offer = await getPublishedOfferBySlug(params.slug)
  if (!offer) notFound()

  const all = await getPublishedOffers()
  const breakdown = getProductBreakdown('studentvault')

  const related = all
    .filter((o) => o.slug !== offer.slug && o.category === offer.category)
    .slice(0, 3)

  const dependencies = offer.dependsOn
    .map((slug) => all.find((o) => o.slug === slug))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))

  const url = `https://matrixo.in/studentvault/${offer.slug}`
  const verifiedOn = formatDate(offer.lastVerifiedAt)
  const expiresOnLabel = formatDate(offer.expiresOn)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'StudentVault', item: 'https://matrixo.in/studentvault' },
        {
          '@type': 'ListItem',
          position: 2,
          name: offer.category,
          item: `https://matrixo.in/studentvault/category/${encodeURIComponent(offer.category)}`,
        },
        { '@type': 'ListItem', position: 3, name: offer.name, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Is ${offer.name} free for students in India?`,
          acceptedAnswer: { '@type': 'Answer', text: offer.summary },
        },
        ...(offer.eligibility.length
          ? [
              {
                '@type': 'Question',
                name: `Who is eligible for ${offer.name}?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: offer.eligibility.join(' '),
                },
              },
            ]
          : []),
        ...(offer.requiresCard
          ? [
              {
                '@type': 'Question',
                name: `Does ${offer.name} require a card?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    offer.autoChargeNote ||
                    'Yes — a payment method is required. Check the auto-charge terms before claiming.',
                },
              },
            ]
          : []),
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen pt-24 pb-20">
        <div className="container-custom px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-400">
              <li>
                <Link href="/studentvault" className="hover:underline">
                  StudentVault
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/studentvault/category/${encodeURIComponent(offer.category)}`}
                  className="hover:underline"
                >
                  {offer.category}
                </Link>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
            {offer.name} for students in India
          </h1>

          {/* Direct answer within the first 60 words */}
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-5">{offer.summary}</p>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <StatusBadge status={offer.status} />
            <VerifiedBadge
              lastVerifiedAt={offer.lastVerifiedAt}
              verifiedBy={offer.verifiedBy}
            />
            <DeadlineBadge expiresOn={offer.expiresOn} />
            <CardRequiredBadge requiresCard={offer.requiresCard} />
          </div>

          {offer.statusNote && (
            <div className="glass-card p-4 mb-6 border-l-4 border-l-amber-500">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Status note:</strong> {offer.statusNote}
              </p>
            </div>
          )}

          {/* Official link — always free and visible */}
          <a
            href={offer.officialUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="btn-primary inline-flex items-center gap-2 mb-8"
          >
            Go to the official {offer.name} page
            <FaExternalLinkAlt className="text-xs" aria-hidden="true" />
          </a>

          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            {offer.whatYouGet.length > 0 && (
              <section className="glass-card p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                  What you get
                </h2>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
                  {offer.whatYouGet.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {offer.eligibility.length > 0 && (
              <section className="glass-card p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Eligibility
                </h2>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
                  {offer.eligibility.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <dl className="glass-card p-5 mb-8 grid gap-4 sm:grid-cols-2 text-sm">
            {offer.valueInr > 0 && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Estimated value</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">
                  ≈ ₹{offer.valueInr.toLocaleString('en-IN')}
                </dd>
              </div>
            )}
            {expiresOnLabel && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Deadline</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">
                  {expiresOnLabel}
                </dd>
              </div>
            )}
            {verifiedOn && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Last verified</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">
                  {verifiedOn}
                  {offer.verifiedBy ? ` · ${offer.verifiedBy}` : ''}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Category</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">
                {offer.category}
              </dd>
            </div>
          </dl>

          {offer.indiaNote && (
            <section className="glass-card p-5 mb-8">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
                For students in India
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{offer.indiaNote}</p>
            </section>
          )}

          {offer.requiresCard && (
            <section className="glass-card p-5 mb-8 border-l-4 border-l-amber-500">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2">
                <FaExclamationTriangle
                  className="text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                Auto-charge warning
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {offer.autoChargeNote ||
                  'This offer requires a payment method. Check the provider’s renewal terms before you claim it.'}
              </p>
            </section>
          )}

          {dependencies.length > 0 && (
            <section className="glass-card p-5 mb-8">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                Claim these first
              </h2>
              <ul className="space-y-2 text-sm">
                {dependencies.map((dep) => (
                  <li key={dep.slug}>
                    <Link
                      href={`/studentvault/${dep.slug}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {dep.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Paid CTA — content itself is never sent to the client */}
          <section className="glass-card-elevated p-6 mb-8">
            <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-2">
              Need the step-by-step claim walkthrough?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              The facts above are free and always will be. StudentVault members get the
              detailed claim walkthrough for {offer.name}, the India verification
              playbook, rejection recovery steps, deadline alerts and a personal
              tracker.
            </p>
            <Link href="/studentvault/unlock" className="btn-primary inline-flex">
              Unlock for ₹{breakdown?.total ?? 104} (one-time)
            </Link>
          </section>

          {related.length > 0 && (
            <section>
              <h2 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-4">
                Related offers in {offer.category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((o) => (
                  <OfferCard key={o.id} offer={o} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
