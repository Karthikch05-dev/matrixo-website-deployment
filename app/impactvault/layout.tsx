import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ImpactVault - Community Impact | matriXO',
  description: 'Explore matriXO ImpactVault - see our community impact, student success stories, and the difference we\'re making in technical education.',
  openGraph: {
    title: 'ImpactVault - Community Impact | matriXO',
    description: 'See our community impact and student success stories.',
    url: 'https://matrixo.in/impactvault',
    siteName: 'matriXO',
    images: [{ url: 'https://matrixo.in/logos/matrixo logo wide.png', width: 1200, height: 630 }],
  },
}

export default function ImpactVaultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
