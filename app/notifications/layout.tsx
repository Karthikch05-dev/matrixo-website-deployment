import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'New matriXO events, hackathons and StudentVault offers.',
  robots: { index: false, follow: true },
}

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
