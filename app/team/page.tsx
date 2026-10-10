import type { Metadata } from 'next'
import TeamContent from '@/components/team/TeamContent'

export const metadata: Metadata = {
  title: 'Team',
  description: 'Meet the matriXO team: the students, engineers and organisers who run matriXO’s workshops, hackathons and events.',
  alternates: { canonical: '/team' },
  openGraph: { url: '/team', title: 'The matriXO team' },
}

export default function TeamPage() {
  return <TeamContent />
}
