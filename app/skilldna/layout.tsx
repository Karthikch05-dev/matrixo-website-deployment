import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SkillDNA Assessment | matriXO',
  description: 'Discover your technical DNA with matriXO SkillDNA. Take the assessment to map your skills, identify strengths, and get personalized growth recommendations.',
  openGraph: {
    title: 'SkillDNA - Discover Your Technical DNA | matriXO',
    description: 'Map your technical skills and get personalized growth recommendations.',
    url: 'https://matrixo.in/skilldna',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function SkillDNALayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
