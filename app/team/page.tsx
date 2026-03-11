import { Metadata } from 'next'
import TeamContent from '@/components/team/TeamContent'

export const metadata: Metadata = {
  title: 'Our Team - matriXO',
  description: 'Meet the passionate team behind matriXO, working to revolutionize event ticketing for students.',
}

export default function TeamPage() {
  return <TeamContent />
}
