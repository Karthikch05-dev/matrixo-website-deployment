import { Metadata } from 'next'
import CareersContent from '@/components/careers/CareersContent'

export const metadata: Metadata = {
  title: 'Careers - Join Our Team | matriXO',
  description: 'Explore career opportunities at matriXO. Join our team and help shape the future of technical education through innovative events and tech solutions.',
  openGraph: {
    title: 'Careers at matriXO - Join Our Team',
    description: 'Explore open positions at matriXO. We\'re building innovative EdTech solutions.',
    url: 'https://matrixo.in/careers',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630, alt: 'Careers at matriXO' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers at matriXO',
    description: 'Explore open positions and join our team.',
    images: ['https://matrixo.in/logos/matrixo logo wide.png'],
  },
}

export default function CareersPage() {
  return <CareersContent />
}
