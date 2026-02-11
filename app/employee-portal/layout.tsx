import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Employee Portal | matriXO Team',
  description: 'matriXO internal employee portal for team management, attendance tracking, meetings, and collaboration.',
  robots: { index: false, follow: false },
}

export default function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
