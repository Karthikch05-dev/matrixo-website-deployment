import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PlayCred - Gamified Learning | matriXO',
  description: 'Earn credentials through gamified learning with PlayCred by matriXO. Complete challenges, earn badges, and showcase your technical skills.',
  openGraph: {
    title: 'PlayCred - Gamified Learning | matriXO',
    description: 'Earn credentials through gamified technical challenges.',
    url: 'https://matrixo.in/playcred',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function PlayCredLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
