import { Metadata } from 'next'
import ServicesContent from '@/components/services/ServicesContent'

export const metadata: Metadata = {
  title: 'Services - matriXO Ticketing Solutions',
  description: 'Comprehensive event ticketing solutions for educational institutions and event organizers. Analytics, integrations, and seamless payment processing.',
}

export default function ServicesPage() {
  return <ServicesContent />
}
