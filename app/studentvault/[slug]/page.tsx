import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Check, Info } from 'lucide-react'
import { Container } from '@/components/ui/Section'
import { Badge } from '@/components/ui/Badge'
import { getPublishedOfferBySlug, getPublishedOffers } from '@/lib/studentvault/data'
import { getDisplayPrice } from '@/lib/studentvault/pricing'
import { daysUntil } from '@/lib/studentvault/types'
import PerkLogo from '@/components/studentvault/PerkLogo'
import ClaimBox from '@/components/studentvault/ClaimBox'
import { TrustBadge, formatShortDate } from '@/components/studentvault/perkMeta'

export const revalidate = 3600

type Props = { params: { slug: string } }

export async function generateStaticParams() {
  const offers = await getPublishedOffers().catch(() => [])
  return offers.map((offer) => ({ slug: offer.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await getPublishedOfferBySlug(params.slug)
  if (!offer) return { title: 'Perk not found' }
  const path = `/studentvault/${offer.slug}`
  return {
    title: `${offer.name} for students in India`,
    description: offer.summary.slice(0, 158),
    alternates: { canonical: path },
    openGraph: {
      title: `${offer.name} — student perk explained`,
      description: offer.summary.slice(0, 158),
      url: path,
      type: 'article',
      modifiedTime: offer.lastVerifiedAt ?? offer.updatedAt ?? undefined,
    },
  }
}

function longDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export default async function OfferPage({ params }: Props) {
  const offer = await getPublishedOfferBySlug(params.slug)
  if (!offer) notFound()

  const [all, price] = await Promise.all([getPublishedOffers(), getDisplayPrice()])
  const related = all.filter((o) => o.slug !== offer.slug && o.category === offer.category && o.status !== 'ended').slice(0, 3)
  const dependencies = offer.dependsOn
    .map((slug) => all.find((o) => o.slug === slug))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
  const days = daysUntil(offer.expiresOn)
  const url = `https://matrixo.in/studentvault/${offer.slug}`

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
        { '@type': 'Question', name: `Is ${offer.name} free for students in India?`, acceptedAnswer: { '@type': 'Answer', text: offer.summary } },
        ...(offer.eligibility.length
          ? [{ '@type': 'Question', name: `Who is eligible for ${offer.name}?`, acceptedAnswer: { '@type': 'Answer', text: offer.eligibility.join(' ') } }]
          : []),
        ...(offer.requiresCard
          ? [
              {
                '@type': 'Question',
                name: `Does ${offer.name} need a card?`,
                acceptedAnswer: { '@type': 'Answer', text: offer.autoChargeNote || 'Yes — a payment method is required. Check the renewal terms before claiming.' },
              },
            ]
          : []),
      ],
    },
  ]

  const facts = [
    offer.valueInr > 0 && { label: 'Indicative value', value: `≈ ₹${offer.valueInr.toLocaleString('en-IN')}` },
    offer.expiresOn && { label: 'Deadline', value: longDate(offer.expiresOn) },
    { label: 'Category', value: offer.category },
    {
      label: offer.lastVerifiedAt ? 'Checked by matriXO' : 'Researched',
      value: longDate(offer.lastVerifiedAt ?? offer.researchedAt) ?? '—',
    },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container size="narrow" className="pb-24 pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[14px] text-muted">
          <Link href="/studentvault" className="inline-flex items-center gap-1 hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> StudentVault
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/studentvault/category/${encodeURIComponent(offer.category)}`} className="hover:text-ink">
            {offer.category}
          </Link>
        </nav>

        <header className="mt-6 flex items-start gap-4">
          <PerkLogo name={offer.name} slug={offer.slug} logoUrl={offer.logoUrl} size={60} />
          <div className="min-w-0">
            <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[40px]">{offer.name}</h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <TrustBadge offer={offer} />
              {days !== null && days >= 0 && (
                <Badge tone={days <= 14 ? 'danger' : days <= 60 ? 'warning' : 'neutral'}>
                  {days === 0 ? 'Ends today' : `${days} days left`}
                </Badge>
              )}
              {offer.requiresCard && <Badge tone="warning">Card needed</Badge>}
            </div>
          </div>
        </header>

        <p className="mt-6 text-[19px] leading-relaxed text-ink">{offer.summary}</p>

        {offer.statusNote && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-[15px] text-ink">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <p>{offer.statusNote}</p>
          </div>
        )}

        <dl className="mt-8 grid grid-cols-2 gap-4 rounded-card border border-line bg-surface p-5 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-[12px] text-subtle">{f.label}</dt>
              <dd className="mt-0.5 text-[15px] font-medium text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {offer.whatYouGet.length > 0 && (
            <section>
              <h2 className="text-[17px] font-semibold text-ink">What you get</h2>
              <ul className="mt-3 space-y-2.5">
                {offer.whatYouGet.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-muted">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {offer.eligibility.length > 0 && (
            <section>
              <h2 className="text-[17px] font-semibold text-ink">Who’s eligible</h2>
              <ul className="mt-3 space-y-2.5">
                {offer.eligibility.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-muted">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {offer.indiaNote && (
          <section className="mt-10 rounded-card bg-canvas-subtle p-5 sm:p-6">
            <h2 className="text-[17px] font-semibold text-ink">For students in India</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{offer.indiaNote}</p>
          </section>
        )}

        {offer.requiresCard && (
          <section className="mt-6 flex gap-3 rounded-card border border-warning/25 bg-warning/10 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <h2 className="text-[16px] font-semibold text-ink">Watch out for auto-charge</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">
                {offer.autoChargeNote || 'This perk needs a payment method. Check the renewal terms before you claim it.'}
              </p>
            </div>
          </section>
        )}

        {dependencies.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[17px] font-semibold text-ink">Claim these first</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {dependencies.map((dep) => (
                <li key={dep.slug}>
                  <Link
                    href={`/studentvault/${dep.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4 text-[14px] font-medium text-ink hover:border-line-strong"
                  >
                    <PerkLogo name={dep.name} slug={dep.slug} logoUrl={dep.logoUrl} size={26} />
                    {dep.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12">
          <ClaimBox offerId={offer.id} slug={offer.slug} name={offer.name} price={price} />
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-[19px] font-semibold text-ink">More in {offer.category}</h2>
            <ul className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
              {related.map((o) => (
                <li key={o.id}>
                  <Link href={`/studentvault/${o.slug}`} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-canvas-subtle">
                    <PerkLogo name={o.name} slug={o.slug} logoUrl={o.logoUrl} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink">{o.name}</span>
                      <span className="block truncate text-[13px] text-muted">{o.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-12 text-[13px] leading-relaxed text-subtle">
          {offer.lastVerifiedAt
            ? `Checked against the provider’s official page on ${formatShortDate(offer.lastVerifiedAt)}.`
            : 'Compiled from the provider’s public pages; our team re-checks every perk.'}{' '}
          Offers change — always confirm the terms on the provider’s page. matriXO isn’t affiliated with {offer.name.split(' ')[0]}.
        </p>
      </Container>
    </>
  )
}
