import type { Metadata } from 'next'
import EventsListing from '@/components/events/EventsListing'
import { getListedEvents } from '@/lib/events'
import { getHiddenEventSlugs } from '@/lib/eventVisibilityServer'

// Re-render every five minutes so event status and admin visibility stay fresh.
export const revalidate = 300

export const metadata: Metadata = {
  title: { absolute: 'matriXO — Workshops, hackathons and career programs for students' },
  description:
    'Find hands-on technical workshops, hackathons and talks run by matriXO with colleges across India. See dates, venues and prices, and register in a minute.',
  alternates: { canonical: '/' },
  openGraph: {
    url: '/',
    title: 'matriXO — Workshops, hackathons and career programs for students',
    description: 'Hands-on workshops, hackathons and talks run with colleges across India.',
  },
}

export default async function HomePage() {
  // Hidden events are dropped on the server so the grid never reflows after load.
  const hidden = await getHiddenEventSlugs()
  return <EventsListing events={getListedEvents().filter((e) => !hidden.has(e.slug))} />
}
