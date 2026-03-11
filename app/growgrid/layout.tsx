import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GrowGrid - Career Growth Tracker | matriXO',
  description: 'Track your career growth journey with GrowGrid by matriXO. Set goals, track milestones, and accelerate your professional development.',
  openGraph: {
    title: 'GrowGrid - Career Growth Tracker | matriXO',
    description: 'Track your career growth and professional development milestones.',
    url: 'https://matrixo.in/growgrid',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function GrowGridLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
