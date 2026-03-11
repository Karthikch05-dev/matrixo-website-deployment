import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Profile | matriXO',
  description: 'Manage your matriXO profile, view your event registrations, and update your personal information.',
  robots: { index: false, follow: false },
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
