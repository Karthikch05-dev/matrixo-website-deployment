import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SkillDNA™ - AI Skill Genome Engine | matriXO',
  description: 'Discover your unique skill genome with SkillDNA™. AI-powered skill profiling, career alignment analysis, personalized learning paths, and dynamic skill scoring.',
  openGraph: {
    title: 'SkillDNA™ - AI-Powered Skill Genome Engine | matriXO',
    description: 'Map your technical skills, get AI-powered career alignment insights, and follow personalized learning paths.',
    url: 'https://beta.matrixo.in/skilldna',
    siteName: 'matriXO Beta',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function SkillDNALayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
