import type { Metadata } from 'next'
import EventsListing from '@/components/events/EventsListing'
import { getListedEvents } from '@/lib/events'
import { getHiddenEventSlugs } from '@/lib/eventVisibilityServer'

// Re-render every five minutes so event status and admin visibility stay fresh.
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Upcoming and past matriXO events: technical workshops, hackathons and talks for students. Dates, venues, prices and registration.',
  alternates: { canonical: '/events' },
  openGraph: {
    url: '/events',
    title: 'Events · matriXO',
    description: 'Upcoming and past matriXO workshops, hackathons and talks for students.',
  },
}

export default async function EventsPage() {
  const hidden = await getHiddenEventSlugs()
  return <EventsListing events={getListedEvents().filter((e) => !hidden.has(e.slug))} />
}
