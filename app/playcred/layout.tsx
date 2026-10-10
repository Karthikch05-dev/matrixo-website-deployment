import { Metadata } from 'next'
import { BETA_PRODUCTS_ENABLED } from '@/lib/site'

export const metadata: Metadata = {
  // Beta product: kept out of search on matrixo.in, indexable on beta.
  robots: BETA_PRODUCTS_ENABLED ? undefined : { index: false, follow: false },
  title: 'PlayCred — gamified learning',
  description: 'Earn credentials through gamified learning with PlayCred by matriXO. Complete challenges, earn badges, and showcase your technical skills.',
  openGraph: {
    title: 'PlayCred - Gamified Learning | matriXO',
    description: 'Earn credentials through gamified technical challenges.',
    url: 'https://matrixo.in/playcred',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/brand/og-default.png', width: 1200, height: 630 }],
  },
}

export default function PlayCredLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
