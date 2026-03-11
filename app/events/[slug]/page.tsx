import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import EventDetail from '@/components/events/EventDetail'
import eventsData from '@/data/events.json'

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = eventsData.find(e => e.slug === params.slug)
  
  if (!event) {
    return {
      title: 'Event Not Found - matriXO',
    }
  }

  const eventUrl = `https://matrixo.in/events/${event.slug}`
  const eventImage = event.images.banner.startsWith('http') 
    ? event.images.banner 
    : `https://matrixo.in${event.images.banner}`

  return {
    title: `${event.title} - matriXO`,
    description: event.description,
    keywords: `${event.title}, ${event.tags.join(', ')}, matriXO events, ${event.category}`,
    openGraph: {
      type: 'website',
      url: eventUrl,
      title: `${event.title} | ${event.tagline}`,
      description: event.description,
      siteName: 'matriXO',
      images: [
        {
          url: eventImage,
          width: 1200,
          height: 630,
          alt: `${event.title} - ${event.tagline}`,
          type: 'image/png',
        },
        {
          url: eventImage,
          width: 1080,
          height: 1080,
          alt: `${event.title} - ${event.tagline}`,
          type: 'image/png',
        },
      ],
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.title} | ${event.tagline}`,
      description: event.description,
      images: [eventImage],
      creator: '@matrixo',
    },
    other: {
      'instagram:card': 'summary_large_image',
      'instagram:title': `${event.title} | ${event.tagline}`,
      'instagram:description': event.description,
      'instagram:image': eventImage,
    },
  }
}

export async function generateStaticParams() {
  return eventsData.map((event) => ({
    slug: event.slug,
  }))
}

export default function EventPage({ params }: Props) {
  const event = eventsData.find(e => e.slug === params.slug)

  if (!event) {
    notFound()
  }

  return <EventDetail event={event} />
}
