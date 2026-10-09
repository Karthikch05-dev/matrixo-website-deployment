import { Metadata } from 'next'
import { BETA_PRODUCTS_ENABLED } from '@/lib/site'

export const metadata: Metadata = {
  // Beta product: kept out of search on matrixo.in, indexable on beta.
  robots: BETA_PRODUCTS_ENABLED ? undefined : { index: false, follow: false },
  title: 'MentorMatrix — find your mentor',
  description: 'Connect with industry mentors through MentorMatrix by matriXO. Get personalized guidance and career advice from experienced professionals.',
  openGraph: {
    title: 'MentorMatrix - Find Your Mentor | matriXO',
    description: 'Get personalized mentorship from industry professionals.',
    url: 'https://matrixo.in/mentormatrix',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/brand/og-default.png', width: 1200, height: 630 }],
  },
}

export default function MentorMatrixLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
