import { Metadata } from 'next'
import ApplicationsDashboard from '@/components/careers/ApplicationsDashboard'

export const metadata: Metadata = {
  title: 'Applications Dashboard - Career@matriXO',
  description: 'View and manage job applications.',
}

export default function DashboardPage() {
  return <ApplicationsDashboard />
}
