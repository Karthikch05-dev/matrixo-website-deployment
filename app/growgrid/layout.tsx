import { Metadata } from 'next'
import { BETA_PRODUCTS_ENABLED } from '@/lib/site'

export const metadata: Metadata = {
  // Beta product: kept out of search on matrixo.in, indexable on beta.
  robots: BETA_PRODUCTS_ENABLED ? undefined : { index: false, follow: false },
  title: 'GrowGrid — career growth tracker',
  description: 'Track your career growth journey with GrowGrid by matriXO. Set goals, track milestones, and accelerate your professional development.',
  openGraph: {
    title: 'GrowGrid - Career Growth Tracker | matriXO',
    description: 'Track your career growth and professional development milestones.',
    url: 'https://matrixo.in/growgrid',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/brand/og-default.png', width: 1200, height: 630 }],
  },
}

export default function GrowGridLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
