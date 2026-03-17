import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ImpactVault - Institutional Intelligence Dashboard | matriXO',
  description: 'ImpactVault institutional analytics dashboard - real-time student skill analytics, department insights, placement readiness, and SkillDNA intelligence for colleges.',
  openGraph: {
    title: 'ImpactVault - Institutional Intelligence Dashboard | matriXO',
    description: 'Real-time institutional analytics powered by SkillDNA intelligence.',
    url: 'https://matrixo.in/impactvault',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function ImpactVaultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
