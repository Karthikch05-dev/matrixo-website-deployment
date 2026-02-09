import { Metadata } from 'next'
import CareersContent from '@/components/careers/CareersContent'

export const metadata: Metadata = {
  title: 'Careers - Join Our Team | matriXO',
  description: 'Explore career opportunities at matriXO and help shape the future of technical education.',
}

export default function CareersPage() {
  return <CareersContent />
}
