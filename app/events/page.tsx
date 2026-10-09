import type { Metadata } from 'next'
import EventsListing from '@/components/events/EventsListing'
import { getListedEvents } from '@/lib/events'

export const revalidate = 3600

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

export default function EventsPage() {
  return <EventsListing events={getListedEvents()} />
}
