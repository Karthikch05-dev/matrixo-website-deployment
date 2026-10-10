import type { Metadata } from 'next'
import CareersContent from '@/components/careers/CareersContent'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Open roles and internships at matriXO. Help run workshops, hackathons and products for students across India.',
  alternates: { canonical: '/careers' },
  openGraph: { url: '/careers', title: 'Careers at matriXO' },
}

export default function CareersPage() {
  return <CareersContent />
}
