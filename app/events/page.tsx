import { Metadata } from 'next'
import EventsListing from '@/components/events/EventsListing'

export const metadata: Metadata = {
  title: 'Events & Programs - matriXO',
  description: 'Explore upcoming workshops, hackathons, bootcamps, and technical events hosted by matriXO. Join thousands of students building their tech careers.',
  openGraph: {
    title: 'Events & Programs - matriXO',
    description: 'Explore upcoming technical workshops, hackathons, and bootcamps.',
  },
}

export default function EventsPage() {
  return <EventsListing />
}
