import eventsData from '@/data/events.json'
import { isEventPast } from '@/lib/eventDates'

/**
 * The slice of an event the listing needs. Built on the server so the full
 * events.json (agendas, speakers, descriptions — ~40 KB) never ships to the
 * browser just to render a grid of cards.
 */
export type EventSummary = {
  id: string
  slug: string
  title: string
  tagline: string
  category: string
  date: string
  location: string
  thumbnail: string | null
  href: string
  external: boolean
  status: 'upcoming' | 'sold-out' | 'ended'
  /** Lowest ticket price in rupees; 0 means free. null when not on sale. */
  priceFrom: number | null
  originalPrice: number | null
  featured: boolean
}

type RawEvent = (typeof eventsData)[number] & {
  externalLink?: string
  googleFormLink?: string
  hidden?: boolean
}

// The listing is for events specifically; standalone workshops, courses and
// bootcamps live elsewhere. DevAgentic is categorised as a workshop but is run
// as an event, so it is listed by id.
const ALWAYS_LIST = new Set(['devagents-1-0', 'devagentic-2-0'])
const NON_EVENT_KEYWORDS = ['workshop', 'hackathon', 'course', 'bootcamp', 'webinar', 'competition']

function isListedEvent(event: RawEvent) {
  if (ALWAYS_LIST.has(event.id)) return true
  const category = event.category?.toLowerCase() ?? ''
  const tags = (event.tags ?? []).map((t: string) => t.toLowerCase())
  return !NON_EVENT_KEYWORDS.some((kw) => category.includes(kw) || tags.some((t) => t.includes(kw)))
}

function toSummary(event: RawEvent): EventSummary {
  const tickets = (event.tickets ?? []) as Array<{ price?: number; originalPrice?: number }>
  const prices = tickets.map((t) => t.price).filter((p): p is number => typeof p === 'number')
  const original = tickets.find((t) => typeof t.originalPrice === 'number')
  const isPast = isEventPast(event.date)
  const status: EventSummary['status'] =
    event.status === 'sold-out' ? 'sold-out' : isPast || event.status === 'completed' ? 'ended' : 'upcoming'

  // externalLink entries that point back at matrixo.in are internal pages.
  const external = Boolean(event.externalLink && !/^https?:\/\/(www\.)?matrixo\.in/.test(event.externalLink))
  const href = event.externalLink
    ? external
      ? event.externalLink
      : event.externalLink.replace(/^https?:\/\/(www\.)?matrixo\.in/, '')
    : `/events/${event.slug}`

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    tagline: event.tagline ?? '',
    category: event.category ?? 'Event',
    date: event.date,
    location: event.location ?? '',
    thumbnail: event.images?.thumbnail || null,
    href,
    external,
    status,
    priceFrom: event.googleFormLink ? 0 : prices.length ? Math.min(...prices) : null,
    originalPrice: original?.originalPrice ?? null,
    featured: Boolean(event.featured),
  }
}

export function getListedEvents(): EventSummary[] {
  return (eventsData as RawEvent[]).filter((e) => !e.hidden && isListedEvent(e)).map(toSummary)
}
