import { Metadata } from 'next'
import ContactContent from '@/components/contact/ContactContent'

export const metadata: Metadata = {
  title: 'Contact Us - matriXO',
  description: 'Get in touch with matriXO. We\'re here to help with your event ticketing needs.',
}

export default function ContactPage() {
  return <ContactContent />
}
