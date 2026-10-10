import type { Metadata } from 'next'
import ContactContent from '@/components/contact/ContactContent'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact matriXO about workshops, hackathons and bootcamps at your college, event registrations, partnerships or StudentVault. Email hello@matrixo.in.',
  alternates: { canonical: '/contact' },
  openGraph: { url: '/contact', title: 'Contact matriXO' },
}

export default function ContactPage() {
  return <ContactContent />
}
