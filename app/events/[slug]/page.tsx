import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Lock } from 'lucide-react'
import EventDetail from '@/components/events/EventDetail'
import { ButtonLink } from '@/components/ui/Button'
import eventsData from '@/data/events.json'
import { isEventHiddenServer } from '@/lib/eventVisibilityServer'
import { isEventPast, parseEventDate } from '@/lib/eventDates'
import { SITE } from '@/lib/site'

// Re-check admin visibility and event status at most once a minute.
export const revalidate = 60

type Props = {
  params: { slug: string }
}

type RawEvent = (typeof eventsData)[number] & { externalLink?: string; hidden?: boolean }

function findEvent(slug: string): RawEvent | undefined {
  return (eventsData as RawEvent[]).find((e) => e.slug === slug)
}

function absolute(url?: string): string | undefined {
  if (!url) return undefined
  return url.startsWith('http') ? url : `${SITE.url}${encodeURI(url)}`
}

function shortDescription(event: RawEvent): string {
  const text = [event.tagline, event.description].filter(Boolean).join('. ').replace(/\s+/g, ' ').trim()
  return text.length > 158 ? `${text.slice(0, 155).replace(/\s+\S*$/, '')}…` : text
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = findEvent(params.slug)
  if (!event) return { title: 'Event not found', robots: { index: false } }

  const hidden = await isEventHiddenServer(event.slug)
  const image = absolute(event.images?.banner || event.images?.thumbnail) ?? SITE.ogImage
  const description = shortDescription(event)

  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    robots: hidden ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      url: `/events/${event.slug}`,
      title: event.tagline ? `${event.title} · ${event.tagline}` : event.title,
      description,
      images: [{ url: image, alt: event.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [image],
    },
  }
}

export async function generateStaticParams() {
  return eventsData.map((event) => ({ slug: event.slug }))
}

export default async function EventPage({ params }: Props) {
  const event = findEvent(params.slug)
  if (!event) notFound()

  if (await isEventHiddenServer(event.slug)) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas-subtle text-subtle">
          <Lock aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.03em] text-ink">This event isn’t available</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">It’s been taken down for now. Have a look at what else is coming up.</p>
        <ButtonLink href="/events" className="mt-8">
          See all events
        </ButtonLink>
      </section>
    )
  }

  const eventUrl = `${SITE.url}/events/${event.slug}`
  const image = absolute(event.images?.banner || event.images?.thumbnail)

  // Speakers flagged `hidden` stay in events.json but are not sent to the page.
  const visibleSpeakers = event.speakers?.filter((speaker) => !('hidden' in speaker && speaker.hidden))

  const prices = (event.tickets ?? []).map((t: { price?: number }) => t.price).filter((p): p is number => typeof p === 'number')
  const soldOut = event.status === 'sold-out'
  const tba = /coming soon|tba/i.test(event.location ?? '')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    image: image ? [image] : undefined,
    url: eventUrl,
    startDate: parseEventDate(event.date).toISOString(),
    endDate: parseEventDate(event.endDate || event.date).toISOString(),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: tba
      ? undefined
      : {
          '@type': 'Place',
          name: event.venue || event.location,
          address: {
            '@type': 'PostalAddress',
            addressLocality: event.location,
            addressRegion: 'Telangana',
            addressCountry: 'IN',
          },
        },
    performer: visibleSpeakers?.length
      ? visibleSpeakers.map((speaker: { name: string }) => ({ '@type': 'Person', name: speaker.name }))
      : undefined,
    organizer: {
      '@type': 'Organization',
      name: event.organizer || SITE.name,
      url: SITE.url,
    },
    offers: prices.length
      ? {
          '@type': 'Offer',
          url: eventUrl,
          price: Math.min(...prices),
          priceCurrency: 'INR',
          availability: soldOut
            ? 'https://schema.org/SoldOut'
            : isEventPast(event.date)
              ? 'https://schema.org/Discontinued'
              : 'https://schema.org/InStock',
        }
      : undefined,
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Events', item: `${SITE.url}/events` },
      { '@type': 'ListItem', position: 2, name: event.title, item: eventUrl },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbs]) }} />
      <EventDetail event={{ ...event, speakers: visibleSpeakers }} />
    </>
  )
}
