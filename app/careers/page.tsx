import { Metadata } from 'next'
import CareersContent from '@/components/careers/CareersContent'

export const metadata: Metadata = {
  title: 'Carrier@matriXO - Join Our Team',
  description: 'Explore career opportunities at matriXO and help shape the future of technical education.',
}

export default function CareersPage() {
  return <CareersContent />
}
