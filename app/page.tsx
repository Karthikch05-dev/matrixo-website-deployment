import type { Metadata } from 'next'
import Hero from '@/components/home/Hero'
import About from '@/components/home/About'
import Features from '@/components/home/Features'
import Partners from '@/components/home/Partners'
import CTA from '@/components/home/CTA'
import Stats from '@/components/home/Stats'

export const metadata: Metadata = {
  title: 'matriXO - AI-Powered Career Growth Platform',
  description: 'matriXO is an AI-powered career growth platform. SkillDNA™ maps your skills, GrowGrid™ builds personalized learning paths, PlayCred™ verifies your achievements, and MentorMatrix™ connects you with industry mentors.',
  keywords: 'matriXO, SkillDNA, AI skill analysis, career growth, personalized learning, blockchain credentials, ed-tech, skill genome, mentorship, GrowGrid, PlayCred',
  openGraph: {
    type: 'website',
    url: 'https://matrixo.in',
    title: 'matriXO - AI-Powered Career Growth Platform',
    description: 'Map your skills with AI. Grow with personalized paths. Prove your worth with verified credentials. matriXO — the future of career development.',
    siteName: 'matriXO',
    images: [
      {
        url: '/logos/logo-dark.png',
        width: 1200,
        height: 630,
        alt: 'matriXO - AI-Powered Career Growth Platform',
        type: 'image/png',
      },
      {
        url: '/logos/logo-dark.png',
        width: 1080,
        height: 1080,
        alt: 'matriXO - AI-Powered Career Growth Platform',
        type: 'image/png',
      },
    ],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'matriXO - AI-Powered Career Growth Platform',
    description: 'Map your skills with AI. Grow with personalized paths. Prove your worth with verified credentials.',
    images: ['/logos/logo-dark.png'],
    creator: '@matrixo',
  },
  other: {
    'instagram:card': 'summary_large_image',
    'instagram:title': 'matriXO - AI-Powered Career Growth Platform',
    'instagram:description': 'AI-powered skill analysis, personalized learning, and blockchain-verified credentials.',
    'instagram:image': 'https://matrixo.in/logos/logo-dark.png',
  },
}

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <About />
      <Features />
      <Partners />
      <CTA />
    </>
  )
}
