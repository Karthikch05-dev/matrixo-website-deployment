import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MentorMatrix - Find Your Mentor | matriXO',
  description: 'Connect with industry mentors through MentorMatrix by matriXO. Get personalized guidance and career advice from experienced professionals.',
  openGraph: {
    title: 'MentorMatrix - Find Your Mentor | matriXO',
    description: 'Get personalized mentorship from industry professionals.',
    url: 'https://matrixo.in/mentormatrix',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function MentorMatrixLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
