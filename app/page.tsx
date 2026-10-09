import type { Metadata } from 'next'
import EventsListing from '@/components/events/EventsListing'
import { getListedEvents } from '@/lib/events'

// Rebuild hourly so event status and visibility stay fresh between deploys.
export const revalidate = 3600

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

export default function HomePage() {
  return <EventsListing events={getListedEvents()} />
}
